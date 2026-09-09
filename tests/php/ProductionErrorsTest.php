<?php
declare(strict_types=1);

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class ProductionErrorsTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/ivfi-errors-' . bin2hex(random_bytes(8));
        mkdir($this->root, 0700);
    }

    protected function tearDown(): void
    {
        if(is_file($this->root . '/.indexer.config.php')) {
            unlink($this->root . '/.indexer.config.php');
        }
        rmdir($this->root);
    }

    private function request(string $uri, ?string $config = null): array
    {
        $build = dirname(__DIR__, 2) . '/build/indexer.php';
        self::assertFileExists($build, 'Run pnpm build before the PHP tests.');
        if($config !== null) {
            file_put_contents($this->root . '/.indexer.config.php', '<?php return ' . $config . ';');
        }
        // Start with display_errors ON to check that production overrides it.
        $process = proc_open(
            [PHP_BINARY, '-d', 'display_errors=1', __DIR__ . '/render.php', $build],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes, $this->root
        );
        self::assertIsResource($process);
        fwrite($pipes[0], json_encode(['uri' => $uri, 'prepend' => '', 'captureResponse' => true]));
        fclose($pipes[0]);
        $output = stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        self::assertSame(0, proc_close($process), $errors);
        return json_decode($output, true, 512, JSON_THROW_ON_ERROR) + ['log' => $errors];
    }

    public static function expectedErrors(): array
    {
        return [
            'missing path, default config' => ['/missing/', null, 404, 'Not Found'],
            'missing path, explicit production' => ['/missing/', "['debug' => false]", 404, 'Not Found'],
            'path outside base' => ['/../', null, 403, 'Forbidden'],
            'direct file access disabled' => ['/.indexer.config.php', '[]', 403, 'Forbidden'],
        ];
    }

    #[DataProvider('expectedErrors')]
    public function testExpectedErrorsArePrivate(string $uri, ?string $config, int $status, string $message): void
    {
        $response = $this->request($uri, $config);
        self::assertSame($status, $response['status']);
        self::assertSame('<h3>' . $status . ' ' . $message . '</h3>', $response['body']);
        self::assertSame('0', $response['displayErrors']);
        self::assertSame('', $response['log']);
    }

    public function testDebugIsExplicitAndKeepsTheCorrectStatus(): void
    {
        $response = $this->request('/missing/', "['debug' => true]");
        self::assertSame(404, $response['status']);
        self::assertStringContainsString('Stack trace:', $response['body']);
        self::assertSame('1', $response['displayErrors']);
    }

    public function testRenderingErrorsDiscardPartialOutputAndLogDetails(): void
    {
        $response = $this->request('/', <<<'PHP'
['inject' => ['footer' => function () {
    echo 'partial-output-marker';
    throw new TypeError('private failure <probe>');
}]]
PHP);
        self::assertSame(500, $response['status']);
        self::assertSame('<h3>500 Internal Server Error</h3>', $response['body']);
        self::assertStringContainsString('IVFi: TypeError: private failure <probe>', $response['log']);
    }
}
