<?php

namespace App\Controller;

use App\Entity\AdvancedFilter;
use App\Repository\AdvancedFilterRepository;
use App\Services\FilterService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

/**
 * @Route("/filter", name="filter")
 */
class AdvancedFilterController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private AdvancedFilterRepository $filterRepository;
    private FilterService $filterService;

    public function __construct(
        EntityManagerInterface $entityManager,
        AdvancedFilterRepository $filterRepository,
        FilterService $filterService
    ) {
        $this->entityManager = $entityManager;
        $this->filterRepository = $filterRepository;
        $this->filterService = $filterService;
    }

    /**
     * @Route("/result", name="getResult", methods={"GET"})
     */
    public function getResult(Request $request)
    {
        $data = $this->filterService->getData($request);
        $headers = $data["headers"];
        $result = $this->filterRepository->BuildBaseQuery($data);
        return new JsonResponse([
            "registros" => $result,
            "headers" => $headers
        ]);
    }

    /**
     * @Route("/{entity}", name="getFilter", methods={"GET"})
     */
    public function findAllFiltersByUser(AdvancedFilterRepository $advancedFilterRepository, string $entity)
    {
        try {
            $userId = $this->getUser()->getId();
            if (!$userId) {
                throw new \Exception('User not authenticated');
            }
            $filters = $advancedFilterRepository->findBy([
                'userId' => $userId,
                'nameEntity' => $entity
            ], ["id" => "DESC"]);
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
     * Actualiza un filtro existente.
     *
     * @Route("/{id}", name="update", methods={"PUT"})
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            $filter = $this->filterRepository->find($id);
            if (!$filter) {
                return $this->json([
                    'success' => false,
                    'message' => 'Filtro no encontrado.',
                ], 404);
            }

            if (!isset($data['name'], $data['filterJson'])) {
                return $this->json([
                    'success' => false,
                    'message' => 'Datos incompletos.',
                ], 400);
            }

            $filter->setName($data['name']);
            $filter->setFilterJson($data['filterJson']);
            $filter->setUpdatedAt(new \DateTime());

            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Filtro actualizado exitosamente.',
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error al actualizar el filtro.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Elimina un filtro existente.
     *
     * @Route("/{id}", name="delete", methods={"DELETE"})
     *
     * @param int $id
     * @return JsonResponse
     */
    public function delete(int $id): JsonResponse
    {
        try {
            $filter = $this->filterRepository->find($id);
            if (!$filter) {
                return $this->json([
                    'success' => false,
                    'message' => 'Filtro no encontrado.',
                ], 404);
            }

            $this->entityManager->remove($filter);
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Filtro eliminado exitosamente.',
            ]);
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Maneja las excepciones y devuelve una respuesta JSON adecuada.
     *
     * @param \Exception $exception
     * @return JsonResponse
     */
    private function handleException(\Exception $exception): JsonResponse
    {
        return new JsonResponse([
            'success' => false,
            'message' => 'Ocurrió un error inesperado.',
            'exception' => $exception->getMessage(),
        ], 500);
    }
}
