<?php

namespace App\Services;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Mapping\ClassMetadata;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\QueryBuilder;
use Psr\Log\LoggerInterface;

/**
 * FilterService
 * 
 * This service handles the processing and management of filters for entity queries.
 * It provides functionality to:
 * - Process filter parameters from HTTP requests
 * - Determine filterable fields for entities
 * - Handle both simple fields and entity relationships
 * 
 * @package App\Services
 */
class FilterService
{
    private EntityManagerInterface $em;
    private LoggerInterface $logger;

    /**
     * Constructor
     * 
     * @param EntityManagerInterface $em Doctrine Entity Manager for database operations
     */
    public function __construct(EntityManagerInterface $em, LoggerInterface $logger)
    {
        $this->em = $em;
        $this->logger = $logger;
    }

    /**
     * Processes filters from a request and returns both the filters and filterable fields
     * 
     * This method extracts filter parameters from the request query string and combines them
     * with the list of available filterable fields for the specified entity.
     * 
     * @param Request $request The HTTP request containing filter parameters
     * @param string $entityClass The fully qualified class name of the entity to filter
     * @param array $extraExcludedFields Additional fields to exclude from filtering
     * 
     * @return array An array containing:
     *               - 'filters': Decoded JSON filters from the request
     *               - 'filterableFields': Array of fields that can be filtered
     */
    public function getFilters(Request $request)
    {
        $filterJson = $request->query->get('filtros_activos');
        $filters = $filterJson ? json_decode($filterJson, true) : [];
        return $filters;
    }

    public function applyFiltersToQueryBuilder(QueryBuilder $qb, array $filters, $alias = '')
    {
        if (empty($filters)) return;

        $expr = $qb->expr();
        $whereParts = [];
        $paramIndex = 0;

        foreach ($filters as $index => $filtro) {

            // Verificar que existan los campos necesarios
            if (!isset($filtro['campo']) || !isset($filtro['operador']) || !isset($filtro['valor'])) {
                continue;
            }

            $fieldPath = $alias . '.' . $filtro['campo'];
            if (str_contains($filtro['campo'], '.')) {
                $parts = explode('.', $filtro['campo']);
                $relationAlias = $parts[0];
                $relatedField = $parts[1];
                $relationJoin = $alias . '.' . $relationAlias;

                // Asegura que el join no esté repetido
                $joins = $qb->getDQLPart('join');
                $existingJoin = false;
                if (isset($joins[$alias])) {
                    foreach ($joins[$alias] as $join) {
                        if ($join->getJoin() === $relationJoin) {
                            $existingJoin = true;
                            break;
                        }
                    }
                }

                if (!$existingJoin) {
                    $qb->leftJoin($relationJoin, $relationAlias);
                }

                $fieldPath = $relationAlias . '.' . $relatedField;
            }

            if ($filtro['operador'] === 'Entre' && is_string($filtro['valor'])) {
                $partes = explode(' - ', $filtro['valor']);
                if (count($partes) === 2) {
                    $filtro['valor'] = [$partes[0], $partes[1]];
                }
            }

            $paramName = 'param' . $paramIndex++;
            $cond = null;
            $tipo = $filtro['tipo'] ?? null;
            $valor = $filtro['valor'];

            // Verificar si es un campo de fecha
            $isDateField = isset($filtro['tipo']) && ($filtro['tipo'] === 'datetime' || $filtro['tipo'] === 'date');
            $isCustomCondition = false; // Flag para indicar si ya creamos una condición personalizada

            // Verificar si es un campo de texto para aplicar LOWER()
            $isTextField = isset($filtro['tipo']) && ($filtro['tipo'] === 'string' || $filtro['tipo'] === 'text');

            if ($isDateField) {
                if ($filtro['operador'] === 'Entre' && is_array($filtro['valor'])) {
                    $valor[0] = new \DateTime($valor[0]);
                    $valor[1] = new \DateTime($valor[1]);
                } else if ($filtro['operador'] === 'Igual') {
                    // Para igualdad en fechas, crear un rango para todo el día
                    $fechaInicio = new \DateTime($valor . ' 00:00:00');
                    $fechaFin = new \DateTime($valor . ' 23:59:59');

                    // Usar BETWEEN para comparar solo la fecha, ignorando la hora
                    $paramNameEnd = $paramName . 'end';
                    $cond = $expr->andX(
                        $expr->gte($fieldPath, ':' . $paramName),
                        $expr->lte($fieldPath, ':' . $paramNameEnd)
                    );
                    $qb->setParameter($paramName, $fechaInicio);
                    $qb->setParameter($paramNameEnd, $fechaFin);

                    // Marcar como condición personalizada
                    $isCustomCondition = true;
                    $isRange = true;
                } else {
                    $valor = new \DateTime($valor);
                }
            }

            // Solo procesar el switch si no hemos creado una condición personalizada
            if (!$isCustomCondition) {
                switch ($filtro['operador']) {
                    case 'Igual':
                        if ($isTextField && is_string($valor)) {
                            $cond = $expr->eq($expr->lower($fieldPath), $expr->lower(':' . $paramName));
                        } else {
                            $cond = $expr->eq($fieldPath, ':' . $paramName);
                        }
                        break;
                    case 'Diferente':
                        if ($isTextField && is_string($valor)) {
                            $cond = $expr->neq($expr->lower($fieldPath), $expr->lower(':' . $paramName));
                        } else {
                            $cond = $expr->neq($fieldPath, ':' . $paramName);
                        }
                        break;
                    case 'Contiene':
                        if ($isTextField && is_string($valor)) {
                            $cond = $expr->like($expr->lower($fieldPath), $expr->lower(':' . $paramName));
                        } else {
                            $cond = $expr->like($fieldPath, ':' . $paramName);
                        }
                        $valor = '%' . $valor . '%';
                        break;
                    case 'No contiene':
                        if ($isTextField && is_string($valor)) {
                            $cond = $expr->notLike($expr->lower($fieldPath), $expr->lower(':' . $paramName));
                        } else {
                            $cond = $expr->notLike($fieldPath, ':' . $paramName);
                        }
                        $valor = '%' . $valor . '%';
                        break;
                    case 'Empieza con':
                        if ($isTextField && is_string($valor)) {
                            $cond = $expr->like($expr->lower($fieldPath), $expr->lower(':' . $paramName));
                        } else {
                            $cond = $expr->like($fieldPath, ':' . $paramName);
                        }
                        $valor = $valor . '%';
                        break;
                    case 'Termina con':
                        if ($isTextField && is_string($valor)) {
                            $cond = $expr->like($expr->lower($fieldPath), $expr->lower(':' . $paramName));
                        } else {
                            $cond = $expr->like($fieldPath, ':' . $paramName);
                        }
                        $valor = '%' . $valor;
                        break;
                    case 'Mayor':
                        $cond = $expr->gt($fieldPath, ':' . $paramName);
                        break;
                    case 'Menor':
                        $cond = $expr->lt($fieldPath, ':' . $paramName);
                        break;
                    case 'Mayor o igual':
                        $cond = $expr->gte($fieldPath, ':' . $paramName);
                        break;
                    case 'Menor o igual':
                        $cond = $expr->lte($fieldPath, ':' . $paramName);
                        break;
                    case 'Entre':
                        // Asegura que venga un array con 2 valores
                        if (is_array($filtro['valor']) && count($filtro['valor']) === 2) {
                            $paramA = $paramName . 'a';
                            $paramB = $paramName . 'b';
                            $cond = $expr->andX(
                                $expr->gte($fieldPath, ':' . $paramA),
                                $expr->lte($fieldPath, ':' . $paramB)
                            );
                            $qb->setParameter($paramA, $valor[0]);
                            $qb->setParameter($paramB, $valor[1]);
                        }
                        break;
                }
            }

            // Si es un campo de texto, convertir el valor a minúsculas
            if ($isTextField && is_string($valor)) {
                $valor = strtolower($valor);
            }

            if ($cond) {
                $whereParts[] = [
                    'condition' => $cond,
                    'logical' => $filtro['logico'] ?? 'AND',
                    'param' => $paramName,
                    'value' => $valor,
                    'isRange' => in_array($filtro['operador'], ['Entre', 'RangoFechaPersonalizado'])
                ];
            }
        }

        // Combina las condiciones respetando el operador lógico
        if (!empty($whereParts)) {
            $exprTotal = null;
            foreach ($whereParts as $i => $part) {
                // Establecer parámetros para condiciones que no son de rango
                if (!($part['isRange'] ?? false)) {
                    $qb->setParameter($part['param'], $part['value']);
                }

                if ($i === 0) {
                    $exprTotal = $part['condition'];
                } else {
                    $logical = strtoupper($part['logical']);
                    if ($logical === 'OR') {
                        $exprTotal = $expr->orX($exprTotal, $part['condition']);
                    } elseif ($logical === 'NOT') {
                        // Para NOT, necesitamos negar la condición pero aún así usar AND
                        $exprTotal = $expr->andX($exprTotal, $expr->not($part['condition']));
                    } else {
                        // Por defecto usar AND
                        $exprTotal = $expr->andX($exprTotal, $part['condition']);
                    }
                }
            }

            $qb->andWhere($exprTotal);
        }
    }





    /**
     * Gets the filterable fields from an entity class, excluding specified fields
     * 
     * @param string $entityClass The fully qualified class name of the entity
     * @param array $extraExcludedFields Additional fields to exclude from the filterable fields list
     * 
     * @return array An array of filterable fields with their metadata
     */

    public function getFilterableFields(string $entityClass, array $extraExcludedFields = []): array
    {
        static $cache = [];

        $cacheKey = $entityClass . ':' . md5(implode(',', $extraExcludedFields));

        if (isset($cache[$cacheKey])) {
            return $cache[$cacheKey];
        }

        $meta = $this->em->getClassMetadata($entityClass);
        $excluded = array_flip(array_merge($this->getDefaultExcludedFields(), $extraExcludedFields));

        $result = array_merge(
            $this->getSimpleFields($meta, $excluded),
            $this->getRelationFields($meta, $excluded)
        );

        $cache[$cacheKey] = $result;
        return $result;
    }

    private function getDefaultExcludedFields(): array
    {
        static $defaults = ['id', 'logo', 'descripcion', 'coordenadasSedePrincipal', 'foto', 'nombre'];
        return $defaults;
    }

    private function getSimpleFields(ClassMetadata $meta, array $excluded): array
    {
        $fields = [];

        foreach ($meta->getFieldNames() as $field) {
            if (isset($excluded[$field]) || $meta->hasAssociation($field)) {
                continue;
            }

            $mapping = $meta->getFieldMapping($field);
            $type = $mapping['type'] ?? null;

            if (
                in_array($type, ['string', 'integer', 'boolean', 'float', 'datetime', 'date'], true)
                && $type !== 'text'
                && empty($mapping['unique'])
            ) {
                $fields[] = [
                    'name' => $field,
                    'label' => $this->beautifyFieldName($field),
                    'type' => $type,
                    'isRelation' => false,
                ];
            }
        }

        return $fields;
    }

    private function getRelationFields(ClassMetadata $meta, array $excluded): array
    {
        $fields = [];

        foreach ($meta->getAssociationMappings() as $field => $assoc) {
            if (
                !in_array($assoc['type'], [ClassMetadata::MANY_TO_ONE, ClassMetadata::ONE_TO_ONE], true)
                || isset($excluded[$field])
            ) {
                continue;
            }

            $targetMeta = $this->em->getClassMetadata($assoc['targetEntity']);
            if ($targetMeta->hasField('nombre')) {
                $fields[] = [
                    'name' => $field . '.nombre',
                    'label' => $this->beautifyFieldName($field),
                    'type' => 'string',
                    'isRelation' => true,
                    'relatedField' => 'nombre',
                ];
            }
        }

        return $fields;
    }

    private function beautifyFieldName(string $name): string
    {
        return ucfirst(preg_replace('/(?<=\\w)([A-Z])/', ' $1', $name));
    }
}
