<?php

namespace App\Services;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Mapping\ClassMetadata;
use Symfony\Component\HttpFoundation\Request;
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

    /**
     * Constructor
     * 
     * @param EntityManagerInterface $em Doctrine Entity Manager for database operations
     */
    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
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
    public function processFilters(Request $request, string $entityClass, array $extraExcludedFields = []): array
    {
        $filtersJson = $request->query->get('filtros_activos');
        $filters = $filtersJson ? json_decode($filtersJson, true) : [];
        $filterableFields = $this->getFilterableFields($entityClass, $extraExcludedFields);
        return [
            'filters' => $filters[0]['label'] ?? null,
            'filterableFields' => $filterableFields,
        ];
    }

    /**
     * Gets the filterable fields from an entity class, excluding specified fields
     * 
     * This private method analyzes an entity's metadata to determine which fields can be used for filtering.
     * It handles both simple fields and entity relationships (ManyToOne and OneToOne).
     * 
     * Filtering rules:
     * - Excludes specified fields in $defaultExcludedFields and $extraExcludedFields
     * - Only includes fields of types: string, integer, boolean, float, datetime, date
     * - Excludes text fields and unique fields
     * - For relationships, only includes those with a 'nombre' field
     * 
     * @param string $entityClass The fully qualified class name of the entity
     * @param array $extraExcludedFields Additional fields to exclude from the filterable fields list
     * 
     * @return array An array of filterable fields with their metadata:
     *               - 'name': Field name (or relation.field for relations)
     *               - 'label': Human readable label for the field
     *               - 'type': Data type of the field
     *               - 'isRelation': Boolean indicating if field is a relation
     *               - 'relatedField': For relations, specifies the field used from related entity
     */
    private function getFilterableFields(string $entityClass, array $extraExcludedFields = []): array
    {
        $meta = $this->em->getClassMetadata($entityClass);
        $fields = [];

        $defaultExcludedFields = ['id', 'logo', 'descripcion', 'coordenadasSedePrincipal', 'foto', 'nombre'];
        $excludedFields = array_merge($defaultExcludedFields, $extraExcludedFields);

        // Process regular fields
        foreach ($meta->getFieldNames() as $field) {
            if (in_array($field, $excludedFields, true)) {
                continue;
            }

            if ($meta->hasAssociation($field)) {
                continue;
            }

            $mapping = $meta->getFieldMapping($field);
            $type = $mapping['type'] ?? null;

            if (
                $type === 'text' ||
                !in_array($type, ['string', 'integer', 'boolean', 'float', 'datetime', 'date'], true) ||
                ($mapping['unique'] ?? false)
            ) {
                continue;
            }

            $fields[] = [
                'name' => $field,
                'label' => ucfirst(preg_replace('/(?<=\\w)([A-Z])/', ' $1', $field)),
                'type' => $type,
                'isRelation' => false
            ];
        }

        // Process relationships (ManyToOne and OneToOne)
        foreach ($meta->getAssociationMappings() as $assocField => $assocData) {
            if (!in_array($assocData['type'], [ClassMetadata::MANY_TO_ONE, ClassMetadata::ONE_TO_ONE])) {
                continue;
            }
            if (in_array($assocField, $excludedFields, true)) {
                continue;
            }

            $targetClass = $assocData['targetEntity'];
            $targetMeta = $this->em->getClassMetadata($targetClass);

            if (!$targetMeta->hasField('nombre')) {
                continue;
            }

            $fields[] = [
                'name' => $assocField . '.nombre',
                'label' => ucfirst(preg_replace('/(?<=\\w)([A-Z])/', ' $1', $assocField)),
                'type' => 'string',
                'isRelation' => true,
                'relatedField' => 'nombre'
            ];
        }

        return $fields;
    }

}
