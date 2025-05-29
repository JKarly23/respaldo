<?php

namespace App\EventListener;

use App\Annotation\Filterable;
use Doctrine\Common\Annotations\Reader;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use ReflectionMethod;

class FilterableAnnotationListener
{
    private $reader;
    private $session;

    public function __construct(Reader $reader, SessionInterface $session)
    {
        $this->reader = $reader;
        $this->session = $session;
    }

    public function onKernelController(ControllerEvent $event)
    {
        $controller = $event->getController();

        // Si el controlador es una clase: [ControllerClass, method]
        if (is_array($controller)) {
            $reflection = new ReflectionMethod($controller[0], $controller[1]);
            $annotation = $this->reader->getMethodAnnotation($reflection, Filterable::class);

            if ($annotation instanceof Filterable) {
                // Limpiar sesión previa para filtros
                $this->session->remove('filterable_data');

                // Cargar nueva información en sesión
                $this->session->set('filterable_data', [
                    'entity'     => $annotation->entity,
                    'conditions' => $annotation->conditions,
                    'order'      => $annotation->order,
                    'relations'  => $annotation->relations,
                    'headers'    => $annotation->headers,
                ]);
            }
        }
    }
}
