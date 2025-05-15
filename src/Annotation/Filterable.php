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
     * @var string|null
     */
    public $conditions;

    public function __construct(array $data)
    {
        // Validar que la entidad sea obligatoria
        if (!isset($data['entity']) || empty($data['entity'])) {
            throw new \InvalidArgumentException('The "entity" attribute is required and cannot be null.');
        }

        $this->entity = $data['entity'];
        $this->conditions = $data['conditions'] ?? null; 
    }
}