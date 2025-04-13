<?php
/**
 * This Driver is based entirely on official documentation of the Mattermost Web
 * Services API and you can extend it by following the directives of the documentation.
 *
 * God bless this mess.
 *
 * @author Luca Agnello <luca@gnello.com>
 * @link https://api.mattermost.com/
 */

namespace Gnello\Mattermost\Models;

use Psr\Http\Message\ResponseInterface;

/**
 * Class ElasticsearchModel
 *
 * @package Gnello\MattermostRestApi\Models
 */
class ElasticsearchModel extends AbstractModel
{
    /**
     * @var string
     */
    private static $endpoint = '/elasticsearch';

    /**
     * @return ResponseInterface
     */
    public function testElasticsearchConfiguration()
    {
        return $this->client->post(self::$endpoint . '/test');
    }

    /**
     * @return ResponseInterface
     */
    public function purgeAllElasticsearchIndexes()
    {
        return $this->client->post(self::$endpoint . '/purge_indexes');
    }
}
