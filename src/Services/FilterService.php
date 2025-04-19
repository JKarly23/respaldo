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

    public function applyFiltersToQueryBuilder(QueryBuilder $qb, array  $filters, $alias = '')
    {
        if (empty($filters)) return;

        $expr = $qb->expr();
        $parameters = [];
        $whereParts = [];
        $paramIndex = 0;

        foreach ($filters as $index => $filtro) {
           
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
            $tipo = $filtro['tipo'];
            $valor = $filtro['valor'];

            if ($filtro['tipo'] === 'datetime' || $filtro['tipo'] === 'date') {
                if ($filtro['operador'] === 'Entre' && is_array($filtro['valor'])) {
                    $valor[0] = new \DateTime($valor[0]);
                    $valor[1] = new \DateTime($valor[1]);
                } else {
                    $valor = new \DateTime($valor);
                }
            }

            switch ($filtro['operador']) {
                case 'Igual':
                    $cond = $expr->eq($fieldPath, ':' . $paramName);
                    break;
                case 'Diferente':
                    $cond = $expr->neq($fieldPath, ':' . $paramName);
                    break;
                case 'Contiene':
                    $cond = $expr->like($fieldPath, ':' . $paramName);
                    $valor = '%' . $valor . '%';
                    break;
                case 'Mayor que':
                    $cond = $expr->gt($fieldPath, ':' . $paramName);
                    break;
                case 'Menor que':
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

            if ($cond) {
                $whereParts[] = [
                    'condition' => $cond,
                    'logical' => $filtro['logico'] ?? 'AND',
                    'param' => $paramName,
                    'value' => $valor,
                ];
            }
        }

        // Combina las condiciones respetando el operador lógico
        if (!empty($whereParts)) {
            $exprTotal = null;
            foreach ($whereParts as $i => $part) {
                if ($i === 0) {
                    $exprTotal = $part['condition'];
                } else {
                    if (strtoupper($part['logical']) === 'OR') {
                        $exprTotal = $expr->orX($exprTotal, $part['condition']);
                    } elseif (strtoupper($part['logical']) === 'NOT') {
                        $exprTotal = $expr->andX($exprTotal, $expr->not($part['condition']));
                    } else {
                        $exprTotal = $expr->andX($exprTotal, $part['condition']);
                    }
                }

                if (!in_array($part['logical'], ['NOT'])) {
                    $qb->setParameter($part['param'], $part['value']);
                }
            }
            $qb->andWhere($exprTotal);
            // dd($qb);
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
        $meta = $this->em->getClassMetadata($entityClass);
        $excludedFields = array_merge($this->getDefaultExcludedFields(), $extraExcludedFields);

        $fields = array_merge(
            $this->getSimpleFields($meta, $excludedFields),
            $this->getRelationFields($meta, $excludedFields)
        );

        return $fields;
    }

    /**
     * Gets the default excluded fields
     * 
     * @return array Array of default excluded fields
     */
    private function getDefaultExcludedFields(): array
    {
        return ['id', 'logo', 'descripcion', 'coordenadasSedePrincipal', 'foto', 'nombre'];
    }

    /**
     * Get simple fields that are eligible for filtering
     * 
     * @param ClassMetadata $meta Entity metadata
     * @param array $excludedFields Fields to exclude from the filterable list
     * @return array Filterable simple fields
     */
    private function getSimpleFields(ClassMetadata $meta, array $excludedFields): array
    {
        $fields = [];

        foreach ($meta->getFieldNames() as $field) {
            if (in_array($field, $excludedFields, true) || $meta->hasAssociation($field)) {
                continue;
            }

            $mapping = $meta->getFieldMapping($field);
            if ($this->isFieldFilterable($mapping)) {
                $fields[] = $this->buildFieldMetadata($field, $mapping);
            }
        }

        return $fields;
    }

    /**
     * Determine if a field is filterable based on its type and other attributes
     * 
     * @param array $mapping Field mapping data
     * @return bool True if the field is filterable, false otherwise
     */
    private function isFieldFilterable(array $mapping): bool
    {
        $type = $mapping['type'] ?? null;
        return in_array($type, ['string', 'integer', 'boolean', 'float', 'datetime', 'date'], true)
            && $type !== 'text'
            && !($mapping['unique'] ?? false);
    }

    /**
     * Build metadata for a filterable field
     * 
     * @param string $field Field name
     * @param array $mapping Field mapping data
     * @return array Filterable field metadata
     */
    private function buildFieldMetadata(string $field, array $mapping): array
    {
        return [
            'name' => $field,
            'label' => ucfirst(preg_replace('/(?<=\\w)([A-Z])/', ' $1', $field)),
            'type' => $mapping['type'],
            'isRelation' => false,
        ];
    }

    /**
     * Get relation fields (ManyToOne, OneToOne) that are eligible for filtering
     * 
     * @param ClassMetadata $meta Entity metadata
     * @param array $excludedFields Fields to exclude from the filterable list
     * @return array Filterable relation fields
     */
    private function getRelationFields(ClassMetadata $meta, array $excludedFields): array
    {
        $fields = [];

        foreach ($meta->getAssociationMappings() as $assocField => $assocData) {
            if (!in_array($assocData['type'], [ClassMetadata::MANY_TO_ONE, ClassMetadata::ONE_TO_ONE])) {
                continue;
            }

            if (in_array($assocField, $excludedFields, true)) {
                continue;
            }

            $targetClass = $assocData['targetEntity'];
            $targetMeta = $this->em->getClassMetadata($targetClass);

            if ($targetMeta->hasField('nombre')) {
                $fields[] = [
                    'name' => $assocField . '.nombre',
                    'label' => ucfirst(preg_replace('/(?<=\\w)([A-Z])/', ' $1', $assocField)),
                    'type' => 'string',
                    'isRelation' => true,
                    'relatedField' => 'nombre',
                ];
            }
        }

        return $fields;
    }
}
