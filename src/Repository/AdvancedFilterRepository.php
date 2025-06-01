<?php

namespace App\Repository;

use App\Entity\AdvancedFilter;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use App\Services\FilterService;
use Doctrine\ORM\EntityManagerInterface;

/**
 * @extends ServiceEntityRepository<AdvancedFilter>
 *
 * @method AdvancedFilter|null find($id, $lockMode = null, $lockVersion = null)
 * @method AdvancedFilter|null findOneBy(array $criteria, array $orderBy = null)
 * @method AdvancedFilter[]    findAll()
 * @method AdvancedFilter[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class AdvancedFilterRepository extends ServiceEntityRepository
{
    private $filterService;
    private $entityManager;

    public function __construct(ManagerRegistry $registry, FilterService $filterService, EntityManagerInterface $entityManager)
    {
        parent::__construct($registry, AdvancedFilter::class);
        $this->filterService = $filterService;
        $this->entityManager = $entityManager;
    }

    public function add(AdvancedFilter $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(AdvancedFilter $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function BuildBaseQuery(array $data): array
    {
        $entity     = $data["entity"];
        $conditions = $data["conditions"] ?? [];
        $relations  = $data["relations"] ?? [];
        $selects    = $data["selects"] ?? [];
        $order      = $data["order"] ?? [];

        $alias = 'af';
        $qb = $this->entityManager->createQueryBuilder()
            ->from("App\\Entity\\{$entity}", $alias);

        // SELECT
        if (!empty($data["fields"])) {
            $fields = [];
            foreach ($data["fields"] as $field) {
                $fields[] = "{$alias}.{$field}";
            }

            // Combinar campos base y selects extra
            $selectsFinal = [];
            if (!empty($fields)) {
                $selectsFinal[] = implode(', ', $fields);
            }
            if (!empty($selects)) {
                foreach ($selects as $selectField) {
                    $selectsFinal[] = $selectField;
                }
            }

            $qb->select(implode(', ', $selectsFinal));
        } else {
            $qb->select($alias);
        }

        // RELACIONES: solo procesar una vez
        if (!empty($relations)) {
            foreach ($relations as $relationName) {
                $qb->leftJoin("{$alias}.{$relationName}", $relationName);
                if (empty($data["fields"])) {
                    $qb->addSelect($relationName); // Solo si queremos todas las propiedades
                }
            }
        }

        // CONDICIONES
        if (!empty($conditions)) {
            $this->filterService->applyFiltersToQueryBuilder($qb, $conditions, $alias);
        }

        // ORDEN
        if (!empty($order)) {
            foreach ($order as $field => $direction) {
                $direction = strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC';
                $qb->addOrderBy("{$alias}.{$field}", $direction);
            }
        }

        // Ejecutar la query y retornar resultados como array
        $result = $qb->getQuery()->getArrayResult();
        return $result;
    }
}
