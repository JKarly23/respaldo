<?php
// filepath: src/Annotation/Filterable.php
namespace App\Annotation;

use Doctrine\Common\Annotations\Annotation;

/**
 * @Annotation
 * @Target("METHOD")
 */
class Filterable
{
    /**
     * @var string
     * @Required
     */
    public $entity;

    /**
     * @var array|null
     */
    public $conditions;

    /**
     * @var array|null
     */
    public $order;

    /**
     * @var array|null
     */
    public $relations;

    /**
     * @var array|null
     */
    public $headers;

    public function __construct(array $data)
    {
        // Validar que la entidad sea obligatoria
        if (!isset($data['entity']) || empty($data['entity'])) {
            throw new \InvalidArgumentException('The "entity" attribute is required and cannot be null.');
        }

        $this->entity = $data['entity'];

        // Convertir strings JSON (si vienen como tales) a arrays
        $this->conditions = $this->normalizeArray($data['conditions'] ?? null);
        $this->order      = $this->normalizeArray($data['order'] ?? null);
        $this->relations  = $this->normalizeArray($data['relations'] ?? null);
        $this->headers    = $this->normalizeArray($data['headers'] ?? null);
    }

    /**
     * Convierte cadenas JSON o arrays simples en arrays bien formados
     */
    private function normalizeArray($value): ?array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [$value];
        }
        return is_array($value) ? $value : null;
    }
}
