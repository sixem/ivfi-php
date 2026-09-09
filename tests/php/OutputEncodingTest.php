<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class OutputEncodingTest extends TestCase
{
    private string $root;
    private array $fixtures = [];

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/ivfi-encoding-' . bin2hex(random_bytes(8));
        mkdir($this->root, 0700);
    }

    protected function tearDown(): void
    {
        // Remove only the exact fixtures created by this test, children first.
        foreach (array_reverse($this->fixtures) as $path) {
            is_dir($path) ? rmdir($path) : unlink($path);
        }
        rmdir($this->root);
    }

    private function fixture(string $name, ?string $contents = null): void
    {
        $path = $this->root . '/' . $name;
        if ($contents === null) {
            mkdir($path);
        } else {
            file_put_contents($path, $contents);
        }
        $this->fixtures[] = $path;
    }

    private function render(string $uri = '/', string $prepend = '', array $config = []): DOMXPath
    {
        $build = dirname(__DIR__, 2) . '/build/indexer.php';
        self::assertFileExists($build, 'Run pnpm build before the PHP regression tests.');
        $this->fixture('.indexer.config.php', '<?php return ' . var_export($config + ['debug' => false], true) . ';');
        $process = proc_open(
            [PHP_BINARY, '-d', 'display_errors=stderr', __DIR__ . '/render.php', $build],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
            $this->root
        );
        self::assertIsResource($process);
        fwrite($pipes[0], json_encode(['uri' => $uri, 'prepend' => $prepend], JSON_THROW_ON_ERROR));
        fclose($pipes[0]);
        $html = stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        self::assertSame(0, proc_close($process), $errors);
        self::assertSame('', $errors);

        $document = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        try {
            // DOMDocument's HTML4 parser warns about legitimate HTML5 attributes/tags.
            self::assertTrue($document->loadHTML('<?xml encoding="UTF-8">' . $html));
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
        $xpath = new DOMXPath($document);
        self::assertSame(1, $xpath->query('//div[@class="tableContainer"]/table')->length);
        self::assertSame(0, $xpath->query('//x-probe | //@onmouseover | //@onerror')->length);
        return $xpath;
    }

    public function testNormalRenderingAndProxyLinksArePreserved(): void
    {
        $this->fixture('photos');
        $this->fixture('photos/café & tea.jpg', 'image');
        $page = $this->render('/photos/', '/public');
        self::assertSame('Index of /photos/', $page->evaluate('string(//title)'));
        self::assertSame('café & tea.jpg', $page->evaluate('string(//tr[@class="file"]/td[1]/a)'));
        self::assertSame('/public/photos/café & tea.jpg', rawurldecode($page->evaluate('string(//tr[@class="file"]/td[1]/a/@href)')));
        self::assertSame(2, $page->query('//tr[@class="file"]/td[4]/a/span')->length);
        self::assertSame(1, $page->query('//tr[@class="parent"]/td/a')->length);
    }

    public function testFileAndDirectoryNamesStayTextAndAttributeValues(): void
    {
        $name = 'café & " onmouseover="probe" \' <x-probe>';
        $this->fixture($name);
        $this->fixture($name . '.jpg', 'image');
        $page = $this->render();
        foreach (['directory' => $name, 'file' => $name . '.jpg'] as $type => $expected) {
            $row = '//tr[@class="' . $type . '"]';
            $label = $type === 'directory' ? '[' . $expected . ']' : $expected;
            self::assertSame($label, $page->evaluate('string(' . $row . '/td[1]/a)'));
            self::assertSame($expected, $page->evaluate('string(' . $row . '/td[1]/@data-raw)'));
            self::assertSame('/' . $expected . ($type === 'directory' ? '/' : ''), rawurldecode($page->evaluate('string(' . $row . '/td[1]/a/@href)')));
        }
        self::assertSame($name . '.jpg', $page->evaluate('string(//a[@download]/@filename)'));
    }

    public function testTitleBreadcrumbsAndPrependValuesStayEncoded(): void
    {
        $name = 'folder & " \' <x-probe>';
        $prefix = 'proxy" onmouseover="probe"><x-probe>';
        $this->fixture($name);
        $this->fixture($name . '/photo.jpg', 'image');
        $page = $this->render('/' . rawurlencode($name) . '/', '/' . $prefix);
        self::assertSame('Index of /' . $name . '/', $page->evaluate('string(//title)'));
        self::assertSame($prefix, $page->evaluate('string(//div[@class="path"]/a[2])'));
        self::assertSame('/' . $name . '/', $page->evaluate('string(//div[@class="path"]/a[3])'));
        self::assertSame('/' . $prefix . '/' . $name, $page->evaluate('string(//div[@class="path"]/a[3]/@href)'));
        self::assertSame('/' . $prefix . '/' . $name . '/photo.jpg', rawurldecode($page->evaluate('string(//tr[@class="file"]/td[1]/a/@href)')));
    }

    public function testMetadataAndEmbeddedJsonPreserveValuesWithoutCreatingMarkup(): void
    {
        $value = '</script><x-probe> & " \' <!-- <script>';
        $page = $this->render(config: [
            'format' => ['title' => $value . ' %s'],
            'metadata' => [['name' => 'description', 'content' => $value]],
        ]);
        self::assertSame($value . ' /', $page->evaluate('string(//title)'));
        self::assertSame($value, $page->evaluate('string(//meta[@name="description"]/@content)'));
        $json = $page->evaluate('string(//script[@id="__IVFI_DATA__"])');
        self::assertStringNotContainsString('<', $json);
        $config = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($value . ' %s', $config['format']['title']);
    }
}
