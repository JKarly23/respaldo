<?php

namespace App\Controller;

use App\Entity\AdvancedFilter;
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
    /**
     * @Route("/", name="advanced_filter", methods={"POST"})
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

}
