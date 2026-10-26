<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class ReadmeTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/ivfi-readme-' . bin2hex(random_bytes(8));
        mkdir($this->root, 0700);
        file_put_contents($this->root . '/example.txt', 'Listing stays available');
    }

    protected function tearDown(): void
    {
        foreach (['README.md', 'example.txt'] as $name) {
            $path = $this->root . '/' . $name;
            if (file_exists($path)) {
                chmod($path, 0600);
                unlink($path);
            }
        }
        rmdir($this->root);
    }

    private function render(bool $withoutExtensions = false): DOMXPath
    {
        $build = dirname(__DIR__, 2) . '/build/' . (getenv('IVFI_PHP_VARIANT') ?: 'indexer.php');
        $command = [PHP_BINARY];
        if ($withoutExtensions) $command[] = '-n';
        array_push($command, '-d', 'error_reporting=32767', '-d', 'display_errors=stderr',
            dirname(__DIR__) . '/php/render.php', $build);
        $process = proc_open($command, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $this->root);
        self::assertIsResource($process);
        fwrite($pipes[0], '{"uri":"/","prepend":"","captureResponse":true,"cookies":{"IVFi":"{\"readme\":{\"toggled\":true}}"}}');
        fclose($pipes[0]);
        $output = stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        self::assertSame(0, proc_close($process), $errors);
        self::assertSame('', $errors);
        $response = json_decode($output, true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response['status']);
        $document = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        try {
            self::assertTrue($document->loadHTML('<?xml encoding="UTF-8">' . $response['body']));
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
        $page = new DOMXPath($document);
        self::assertSame(1, $page->query('//tr[@class="file"]/td/a[text()="example.txt"]')->length);
        return $page;
    }

    public function testMarkdownAndSavedOpenState(): void
    {
        file_put_contents($this->root . '/README.md', "# café 日本語\n\n**bold** and [file](example.txt)\n\n| Name | Value |\n| --- | --- |\n| a | b |\n\n\tcode\n");
        $page = $this->render();
        self::assertSame('café 日本語', $page->evaluate('string(//details//h1)'));
        self::assertSame('bold', $page->evaluate('string(//details//strong)'));
        self::assertSame('example.txt', $page->evaluate('string(//details//a/@href)'));
        self::assertSame(1, $page->query('//details[@open]//table')->length);
        self::assertSame('code', $page->evaluate('string(//details//pre/code)'));
    }

    public function testHtmlAndUnsafeLinksAreNeutralised(): void
    {
        file_put_contents($this->root . '/README.md', "<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n> - [bad](javascript:alert(1))\n> - [safe](https://example.com/)\n\n![bad](javascript:alert(2))\n");
        $page = $this->render();
        self::assertSame(1, $page->query('//details')->length);
        self::assertSame(0, $page->query('//details//script | //details//@onerror')->length);
        self::assertStringContainsString('<script>alert(1)</script>', $page->evaluate('string(//details)'));
        foreach ($page->query('//details//@href | //details//@src') as $attribute) {
            self::assertDoesNotMatchRegularExpression('/^(?:javascript|vbscript|data):/i', $attribute->nodeValue);
        }
        self::assertSame(1, $page->query('//details//a[@href="https://example.com/"]')->length);
    }

    public function testSizeLimit(): void
    {
        file_put_contents($this->root . '/README.md', str_repeat('a', 1024 * 1024));
        self::assertSame(1, $this->render()->query('//details')->length);
        file_put_contents($this->root . '/README.md', 'a', FILE_APPEND);
        self::assertSame(0, $this->render()->query('//details')->length);
    }

    public function testMissingReadme(): void
    {
        self::assertSame(0, $this->render()->query('//details')->length);
    }

    public function testUnreadableReadme(): void
    {
        $path = $this->root . '/README.md';
        file_put_contents($path, '# Private');
        chmod($path, 0000);
        clearstatcache();
        if (is_readable($path)) self::markTestSkipped('This user can read files without permission bits.');
        self::assertSame(0, $this->render()->query('//details')->length);
    }

    public function testMissingMbstring(): void
    {
        file_put_contents($this->root . '/README.md', "\tcode");
        self::assertSame(0, $this->render(true)->query('//details')->length);
    }
}
