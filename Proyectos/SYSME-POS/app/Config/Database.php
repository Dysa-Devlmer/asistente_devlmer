<?php

namespace Config;

use CodeIgniter\Database\Config;

/**
 * Database Configuration
 */
class Database extends Config
{
    /**
     * The directory that holds the Migrations and Seeds directories.
     */
    public string $filesPath = APPPATH . 'Database' . DIRECTORY_SEPARATOR;

    /**
     * Lets you choose which connection group to use if no other is specified.
     */
    public string $defaultGroup = 'default';

    /**
     * The default database connection. (SQLite3)
     *
     * @var array<string, mixed>
     */
    public array $default = [
        'DSN'      => '',
        'hostname' => '',
        'username' => '',
        'password' => '',
        'database' => ROOTPATH . 'posventa.db',   // SQLite database file in project root
        'DBDriver' => 'SQLite3',
        'DBPrefix' => 'ospos_',
        'pConnect' => false,
        'DBDebug'  => (ENVIRONMENT !== 'production'),
        'charset'  => 'utf8',
        'DBCollat' => 'utf8_general_ci',
        'swapPre'  => '',
        'encrypt'  => false,
        'compress' => false,
        'strictOn' => false,
        'failover' => [],
        'port'     => '',
    ];

    /**
     * This database connection is used when running PHPUnit database tests.
     * (Also SQLite3 for consistency)
     *
     * @var array<string, mixed>
     */
    public array $tests = [
        'DSN'        => '',
        'hostname'   => '',
        'username'   => '',
        'password'   => '',
        'database'   => ROOTPATH . 'posventa.db',
        'DBDriver'   => 'SQLite3',
        'DBPrefix'   => 'ospos_',
        'pConnect'   => false,
        'DBDebug'    => (ENVIRONMENT !== 'production'),
        'charset'    => 'utf8',
        'DBCollat'   => 'utf8_general_ci',
        'swapPre'    => '',
        'encrypt'    => false,
        'compress'   => false,
        'strictOn'   => false,
        'failover'   => [],
        'port'       => '',
        'foreignKeys'=> true,
        'busyTimeout'=> 1000,
    ];

    /**
     * This database connection is used when developing against non-production data.
     * (Also SQLite3 for consistency)
     *
     * @var array
     */
    public $development = [
        'DSN'        => '',
        'hostname'   => '',
        'username'   => '',
        'password'   => '',
        'database'   => ROOTPATH . 'posventa.db',
        'DBDriver'   => 'SQLite3',
        'DBPrefix'   => 'ospos_',
        'pConnect'   => false,
        'DBDebug'    => (ENVIRONMENT !== 'production'),
        'charset'    => 'utf8',
        'DBCollat'   => 'utf8_general_ci',
        'swapPre'    => '',
        'encrypt'    => false,
        'compress'   => false,
        'strictOn'   => false,
        'failover'   => [],
        'port'       => '',
        'foreignKeys'=> true,
        'busyTimeout'=> 1000,
    ];

    public function __construct()
    {
        parent::__construct();

        // Use correct group for each environment
        switch (ENVIRONMENT) {
            case 'testing':
                $this->defaultGroup = 'tests';
                break;
            case 'development':
                $this->defaultGroup = 'development';
                break;
        }
    }
}
