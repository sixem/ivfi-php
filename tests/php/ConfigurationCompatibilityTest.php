<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class ConfigurationCompatibilityTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/ivfi-config-' . bin2hex(random_bytes(8));
        mkdir($this->root . '/media', 0700, true);
        mkdir($this->root . '/script', 0700);
        file_put_contents($this->root . '/media/photo.webp', 'fixture');
    }

    protected function tearDown(): void
    {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->root, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($files as $file) {
            $file->isDir() ? rmdir($file->getPathname()) : unlink($file->getPathname());
        }
        rmdir($this->root);
    }

    private function variants(): array
    {
        $variant = getenv('IVFI_PHP_VARIANT');
        return $variant ? [$variant] : ['indexer.php', 'standalone.php'];
    }

    private function render(string $variant, ?string $config = null, ?string $beside = null, array $request = []): array
    {
        $project = dirname(__DIR__, 2);
        copy($project . '/build/' . $variant, $this->root . '/script/custom.php');
        foreach (['media' => $config, 'script' => $beside] as $directory => $source) {
            $path = $this->root . '/' . $directory . '/.custom.config.php';
            if ($source !== null) file_put_contents($path, $source);
            elseif (is_file($path)) unlink($path);
        }
        $process = proc_open(
            [(getenv('IVFI_PHP_BINARY') ?: PHP_BINARY), $project . '/tests/php/render.php', $this->root . '/script/custom.php'],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes, $this->root . '/media'
        );
        self::assertIsResource($process);
        fwrite($pipes[0], json_encode($request + ['uri' => '/', 'prepend' => '', 'captureResponse' => true]));
        fclose($pipes[0]);
        $output = stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        self::assertSame(0, proc_close($process), $errors);
        $response = json_decode($output, true, 512, JSON_THROW_ON_ERROR);
        if ($response['status'] === 200) self::assertSame('', $errors);
        return $response;
    }

    private function jsConfig(array $response): array
    {
        self::assertSame(200, $response['status']);
        self::assertSame(1, preg_match('~<script[^>]*id="__IVFI_DATA__"[^>]*>(.*?)</script>~s', $response['body'], $matches));
        return json_decode($matches[1], true, 512, JSON_THROW_ON_ERROR);
    }

    public function testPerformanceDefaultsTo250ItemsAndAllowsOverrides(): void
    {
        for ($i = 0; $i < 248; $i++) {
            file_put_contents($this->root . '/media/file-' . $i . '.txt', '');
        }
        foreach ($this->variants() as $variant) {
            self::assertFalse($this->jsConfig($this->render($variant))['performance']);
            self::assertTrue($this->jsConfig($this->render($variant, '<?php return ["performance" => true];'))['performance']);
        }
        mkdir($this->root . '/media/folder');
        foreach ($this->variants() as $variant) {
            self::assertTrue($this->jsConfig($this->render($variant))['performance']);
            self::assertFalse($this->jsConfig($this->render($variant, '<?php return ["performance" => false];'))['performance']);
            self::assertFalse($this->jsConfig($this->render($variant, '<?php return ["performance" => 251];'))['performance']);
        }
    }

    public function testDateAndFooterShorthandsWorkInBothDistributions(): void
    {
        foreach ($this->variants() as $variant) {
            foreach ([false, true] as $footer) {
                $response = $this->render($variant, '<?php return ' . var_export([
                    'format' => ['date' => 'Y-m-d'], 'footer' => $footer,
                ], true) . ';');
                self::assertSame(['Y-m-d', 'd/m/y'], $this->jsConfig($response)['format']['date']);
                self::assertSame($footer, strpos($response['body'], 'class="bottom"') !== false);
            }
        }
    }

    public function testObsoleteFooterSettingsAreIgnored(): void
    {
        foreach ($this->variants() as $variant) {
            foreach ([false, true] as $enabled) {
                foreach ([false, true, ['unused']] as $obsolete) {
                    $response = $this->render($variant, '<?php return ' . var_export([
                        'footer' => ['enabled' => $enabled, 'show_server_name' => $obsolete],
                        'credits' => false,
                    ], true) . ';');
                    self::assertSame(200, $response['status']);
                    self::assertSame($enabled, strpos($response['body'], 'class="bottom"') !== false);
                    self::assertSame($enabled, strpos($response['body'], 'Generated in') !== false);
                    self::assertStringNotContainsString('class="referenceGit"', $response['body']);
                }
            }
            $response = $this->render($variant, '<?php return ["footer" => ["show_server_name" => false]];');
            self::assertSame(200, $response['status']);
            self::assertStringContainsString('class="bottom"', $response['body']);
            self::assertStringContainsString('class="referenceGit"', $response['body']);
        }
    }

    public function testPartialNestedSettingsAndExplicitListsKeepTheirMeaning(): void
    {
        foreach ($this->variants() as $variant) {
            $response = $this->render($variant, '<?php return ' . var_export([
                'style' => ['themes' => ['default' => false], 'css' => []],
                'extensions' => ['image' => ['avif'], 'video' => []],
                'selection' => ['enabled' => false],
                'preview' => null,
            ], true) . ';');
            $config = $this->jsConfig($response);
            self::assertSame('/indexer/themes/', $config['style']['themes']['path']);
            self::assertSame(['image' => ['avif'], 'video' => []], $config['extensions']);
            self::assertFalse($config['selection']['enabled']);
            self::assertTrue($config['preview']['enabled']);
        }
    }

    public function testDefaultsAndConfigLookupRemainCompatibleAfterRenaming(): void
    {
        foreach ($this->variants() as $variant) {
            self::assertSame('d/m/y H:i', $this->jsConfig($this->render($variant))['format']['date'][0]);
            $config = $this->jsConfig($this->render($variant, '<?php return [];'));
            self::assertSame('m/d/y H:i', $config['format']['date'][0]);
            self::assertTrue($config['selection']['enabled']);
            $beside = '<?php return ["format" => ["title" => "Beside %s"]];';
            self::assertStringContainsString('<title>Beside /</title>', $this->render($variant, null, $beside)['body']);
            $working = '<?php return ["format" => ["title" => "Working %s"]];';
            self::assertStringContainsString('<title>Working /</title>', $this->render($variant, $working, $beside)['body']);
        }
    }

    public function testMalformedConfigFailsClosedWithoutExposingSource(): void
    {
        foreach ($this->variants() as $variant) {
            foreach (['<?php // no return', '<?php return "invalid";', '<?php return ["gallery" => "invalid"];', '<?php return ["authentication" => true];'] as $source) {
                $response = $this->render($variant, $source);
                self::assertSame(500, $response['status']);
                self::assertStringNotContainsString($this->root, $response['body']);
            }
        }
    }

    public function testCallbacksAndExtensionKeysSurviveMerging(): void
    {
        foreach ($this->variants() as $variant) {
            $response = $this->render($variant, <<<'CONFIG'
<?php return [
    'custom' => 'callback-value',
    'inject' => ['head' => function($data) {
        return '<meta name="callback-probe" content="' . $data['config']['custom'] . '">';
    }],
    'processor' => ['item' => function($data) {
        $data['files'][0][1] = 'processed.webp';
        return $data;
    }],
];
CONFIG
            );
            self::assertSame(200, $response['status']);
            self::assertStringContainsString('<meta name="callback-probe" content="callback-value">', $response['body']);
            self::assertStringContainsString('>processed.webp</a>', $response['body']);
        }
    }
    public function testDotfileMetadataAndFiltersComposeWithConfiguredFilters(): void
    {
        file_put_contents($this->root . '/media/ignored.txt', 'ignored');
        file_put_contents($this->root . '/media/notes.md', 'notes');
        foreach ($this->variants() as $variant) {
            file_put_contents($this->root . '/media/.ivfi', '{"metadata":[]}');
            $response = $this->render($variant, '<?php return [];');
            self::assertSame(200, $response['status']);
            self::assertStringContainsString('>photo.webp</a>', $response['body']);
            file_put_contents($this->root . '/media/.ivfi', '{"ignore":["ignored*"],"exclude":["md"]}');
            $response = $this->render($variant, '<?php return ["filter" => ["file" => ["~\\.webp$~", "~^photo~"]]];');
            self::assertSame(200, $response['status']);
            self::assertStringContainsString('>photo.webp</a>', $response['body']);
            self::assertStringNotContainsString('>ignored.txt</a>', $response['body']);
            self::assertStringNotContainsString('>notes.md</a>', $response['body']);
        }
    }

    public function testEncodedPathsAndMalformedPreferencesRemainUsable(): void
    {
        mkdir($this->root . '/media/%70rotected');
        mkdir($this->root . '/media/question?dir');
        foreach ($this->variants() as $variant) {
            foreach (['/%2570rotected/' => '%70rotected', '/question%3Fdir/' => 'question?dir'] as $uri => $name) {
                $response = $this->render($variant, null, null, ['uri' => $uri]);
                self::assertSame(200, $response['status']);
                self::assertStringContainsString('<title>Index of /' . $name . '/</title>', $response['body']);
            }
            foreach ([['invalid'], '{"style":{"theme":[]},"timezoneOffset":9223372036854775807}', 'not json'] as $cookie) {
                self::assertSame(200, $this->render($variant, null, null, ['cookies' => ['IVFi' => $cookie]])['status']);
            }
            self::assertSame(400, $this->render($variant, null, null, ['uri' => '/%00/'])['status']);
        }
    }

    public function testDigestIsBoundToTheRequestedResourceAndRejectsMalformedFields(): void
    {
        mkdir($this->root . '/media/protected');
        mkdir($this->root . '/media/public');
        $config = '<?php return ["authentication" => ["users" => ["fixture" => "secret"], "restrict" => "~^/protected(?:/|$)~"]];';
        $response = md5(md5('fixture:Restricted content.:secret') . ':fixture-nonce:00000001:client:auth:' . md5('GET:/protected/'));
        $digest = 'username="fixture", nonce="fixture-nonce", nc=00000001, cnonce="client", qop=auth, uri="/protected/", response="' . $response . '"';
        foreach ($this->variants() as $variant) {
            foreach (['/protected/', '//protected/', '/public/../protected/'] as $uri) {
                self::assertSame(401, $this->render($variant, $config, null, ['uri' => $uri])['status']);
            }
            self::assertSame(200, $this->render($variant, $config, null, ['uri' => '/protected/', 'digest' => $digest])['status']);
            self::assertSame(400, $this->render($variant, $config, null, ['uri' => '/protected/?other=1', 'digest' => $digest])['status']);
            foreach ([$digest . ', username="fixture"', 'junk ' . $digest, str_replace('nc=00000001', 'nc=00000000', $digest)] as $invalid) {
                self::assertSame(401, $this->render($variant, $config, null, ['uri' => '/protected/', 'digest' => $invalid])['status']);
            }
            self::assertSame(200, $this->render($variant, $config, null, ['uri' => '/public/'])['status']);
        }
    }

}
