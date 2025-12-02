<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * Localization Configuration
 */
class Locale extends BaseConfig
{
    /**
     * Default locale to use
     */
    public string $defaultLocale = 'es';

    /**
     * Array of supported locales
     */
    public array $supportedLocales = ['es', 'en'];

    /**
     * Fallback locale to use if current locale is not available
     */
    public string $fallbackLocale = 'en';

    /**
     * Get the default locale
     *
     * @return string
     */
    public static function getDefault(): string
    {
        return config(Locale::class)->defaultLocale ?? 'es';
    }
}