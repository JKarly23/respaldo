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

    public function BuildBaseQuery(string $entityClass, $filters, array $order = []): array
    {
        $qb = $this->entityManager->createQueryBuilder()
        ->select('af')
        ->from($entityClass, 'af');

        if($filters){
            $this->filterService->applyFiltersToQueryBuilder($qb, $filters, 'af');
        }

        if (!empty($order)) {
            foreach ($order as $field => $direction) {
                $qb->addOrderBy("af.{$field}", $direction);
            }
        }
        // dd($qb);
        $result = $qb->getQuery()->getResult();
        // dd($result);
        return $result;
    }
}
