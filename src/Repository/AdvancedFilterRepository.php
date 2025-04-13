<?php

namespace App\Repository;

use App\Entity\AdvancedFilter;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

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
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AdvancedFilter::class);
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

//    /**
//     * @return AdvancedFilter[] Returns an array of AdvancedFilter objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('a')
//            ->andWhere('a.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('a.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?AdvancedFilter
//    {
//        return $this->createQueryBuilder('a')
//            ->andWhere('a.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
