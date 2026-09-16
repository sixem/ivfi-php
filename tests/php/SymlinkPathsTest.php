<?php
declare(strict_types=1);

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class SymlinkPathsTest extends TestCase
{
    public static function paths(): array
    {
        return [
            'strict internal link' => ['strict', '/internal-link/', 200],
            'weak internal link' => ['weak', '/internal-link/', 200],
            'strict external link' => ['strict', '/external-link/', 403],
            'weak external link' => ['weak', '/external-link/', 200],
            'strict external descendant' => ['strict', '/external-link/child/', 403],
            'weak external descendant' => ['weak', '/external-link/child/', 200],
            'strict outside link' => ['strict', '/../outside-link/', 403],
            'weak outside link' => ['weak', '/../outside-link/', 403],
        ];
    }

    #[DataProvider('paths')]
    public function testDirectorySymlinkPolicy(string $mode, string $uri, int $status): void
    {
        $root = sys_get_temp_dir() . '/ivfi-symlinks-' . bin2hex(random_bytes(8));
        $created = [];
        try {
            foreach([$root, "$root/base", "$root/base/internal", "$root/external", "$root/external/child"] as $directory) {
                mkdir($directory, 0700);
                $created[] = $directory;
            }
            foreach([
                "$root/base/internal-link" => "$root/base/internal",
                "$root/base/external-link" => "$root/external",
                "$root/outside-link" => "$root/external",
            ] as $link => $target) {
                self::assertTrue(symlink($target, $link));
                $created[] = $link;
            }
            foreach(["$root/base/internal", "$root/external", "$root/external/child"] as $directory) {
                file_put_contents("$directory/visible-marker.txt", 'fixture');
                $created[] = "$directory/visible-marker.txt";
            }
            $config = "$root/base/.indexer.config.php";
            file_put_contents($config, '<?php return ' . var_export(['path_checking' => $mode], true) . ';');
            $created[] = $config;

            $build = dirname(__DIR__, 2) . '/build/indexer.php';
            self::assertFileExists($build, 'Run pnpm build before the PHP tests.');
            $process = proc_open(
                [PHP_BINARY, __DIR__ . '/render.php', $build],
                [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
                $pipes, "$root/base"
            );
            self::assertIsResource($process);
            fwrite($pipes[0], json_encode(['uri' => $uri, 'prepend' => '', 'captureResponse' => true], JSON_THROW_ON_ERROR));
            fclose($pipes[0]);
            $output = stream_get_contents($pipes[1]);
            $errors = stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            self::assertSame(0, proc_close($process), $errors);
            self::assertSame('', $errors);
            $response = json_decode($output, true, 512, JSON_THROW_ON_ERROR);
            self::assertSame($status, $response['status']);
            if($status === 200) {
                // Check both the listing and its public link, not just the status.
                self::assertStringContainsString('href="' . $uri . 'visible-marker.txt"', $response['body']);
                self::assertStringContainsString('data-raw="visible-marker.txt"', $response['body']);
            } else {
                self::assertSame('<h3>403 Forbidden</h3>', $response['body']);
            }
        } finally {
            // Unlink fixtures explicitly; never follow a symlink during cleanup.
            foreach(array_reverse($created) as $path) {
                if(is_link($path) || is_file($path)) {
                    unlink($path);
                } else {
                    rmdir($path);
                }
            }
        }
    }
}
