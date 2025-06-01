<?php

namespace App\EventListener;

use App\Annotation\Filterable;
use Doctrine\Common\Annotations\Reader;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use ReflectionMethod;
use ReflectionClass;

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

        if (!is_array($controller)) {
            return;
        }

        $className = get_class($controller[0]);
        $methodName = $controller[1];

        $classReflection = new \ReflectionClass($className);
        $methodReflection = new \ReflectionMethod($className, $methodName);

        $annotation = $this->reader->getMethodAnnotation($methodReflection, Filterable::class);

        if (!$annotation) {
            $annotation = $this->reader->getClassAnnotation($classReflection, Filterable::class);
        }

        if ($annotation instanceof Filterable) {
            if (!$this->session->isStarted()) {
                $this->session->start();
            }
            $this->session->set('filterable_data', [
                'entity'     => $annotation->entity,
                'fields'     => $annotation ->fields,
                'conditions' => $annotation->conditions,
                'order'      => $annotation->order,
                'relations'  => $annotation->relations,
                'headers'    => $annotation->headers,
                'selects'    => $annotation->selects,
            ]);
        } 
    }
}
