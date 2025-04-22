<?php

namespace App\Controller;

use App\Entity\AdvancedFilter;
use App\Repository\AdvancedFilterRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Psr\Log\LoggerInterface;

/**
 * @Route("/filter", name="filter")
 */

class AdvancedFilterController extends AbstractController
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger){
        $this->logger = $logger;
    }
    /**
     * @Route("/", name="savedFilter", methods={"POST"})
     */
    public function savedFilter(Request $request, EntityManagerInterface $em): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $user = $this->getUser();

            if (!$user) {
                return new JsonResponse(['error' => 'Usuario no autenticado'], 401);
            }

            if (!$data || !isset($data['name'], $data['nameEntity'], $data['filterJson'])) {
                return new JsonResponse(['error' => 'Datos incompletos'], 400);
            }

            $filtro = new AdvancedFilter();
            $filtro->setName($data['name']);
            $filtro->setUserId($user->getId());
            $filtro->setNameEntity($data['nameEntity']);
            $filtro->setFilterJson($data['filterJson']);
            $filtro->setCreatedAt(new \DateTime());
            $filtro->setUpdatedAt(new \DateTime());

            $em->persist($filtro);
            $em->flush();

            return new JsonResponse(['message' => 'Filtro guardado con éxito']);
        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Error interno del servidor',
                'exception' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * @Route("/{entity}", name="getFilter", methods={"GET"})
     */
    public function findAllFiltersByUser(AdvancedFilterRepository $advancedFilterRepository, string $entity)
    {
        try {
            $userId = $this->getUser()->getId();
            $this->logger->info('User ID: ' . $userId);
            if (!$userId) {
                throw new \Exception('User not authenticated');
            }
            $filters = $advancedFilterRepository->findBy([
                'userId' => $userId,
                'nameEntity' => $entity
            ]);
            $this->logger->info('Filters: '. json_encode($filters));    
            $filtersData = [];
            foreach ($filters as $filter) {
                $filtersData[] = [
                    'id' => $filter->getId(),
                    'name' => $filter->getName(),
                    'payload' => $filter->getFilterJson(),
                ];
            }
            return new JsonResponse(['filters' => $filtersData]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Error interno del servidor',
                'exception' => $e->getMessage()
            ], 500);
        }
    }
}
