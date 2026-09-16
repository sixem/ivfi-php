<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class PathBoundariesTest extends TestCase
{
    public function testBoundaryComparisonInStrictAndWeakModes(): void
    {
        $root = sys_get_temp_dir() . '/ivfi-boundaries-' . bin2hex(random_bytes(8));
        $directories = [$root, $root . '/base', $root . '/base/child', $root . '/base-other'];
        foreach($directories as $directory) {
            mkdir($directory, 0700);
        }

        try {
            $base = $root . '/base';
            $cases = [];
            $expected = [];
            foreach(['strict' => true, 'weak' => false] as $mode => $resolve) {
                foreach([
                    'base itself' => [$base, $base, true],
                    'descendant' => [$base . '/child', $base, true],
                    'trailing separator' => [$base, $base . '/', true],
                    'trailing separator on target' => [$base . '/child/', $base, true],
                    'sibling with shared prefix' => [$root . '/base-other', $base, false],
                    'traversal to sibling' => [$base . '/../base-other', $base, false],
                    'parent' => [$root, $base, false],
                    'empty base' => [$base, '', false],
                    'empty target' => ['', $base, false],
                ] as $name => [$path, $boundary, $allowed]) {
                    $cases[$mode . ': ' . $name] = [$path, $boundary, $resolve];
                    $expected[$mode . ': ' . $name] = $allowed;
                }
            }
            foreach(['missing target' => [$root . '/missing', $base, true],
                'missing base' => [$base, $root . '/missing', true]] as $name => $case) {
                $cases[$name] = $case;
                $expected[$name] = false;
            }
            if(DIRECTORY_SEPARATOR === '/') {
                foreach([true, false] as $resolve) {
                    $name = 'filesystem root ' . (int) $resolve;
                    $cases[$name] = [$base, '/', $resolve];
                    $expected[$name] = true;
                    $cases[$name . ' itself'] = ['/', '/', $resolve];
                    $expected[$name . ' itself'] = true;
                }
            }

            $build = dirname(__DIR__, 2) . '/build/indexer.php';
            self::assertFileExists($build, 'Run pnpm build before the PHP tests.');
            $process = proc_open(
                [PHP_BINARY, __DIR__ . '/check-boundaries.php', $build],
                [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
                $pipes, $root
            );
            self::assertIsResource($process);
            fwrite($pipes[0], json_encode(['uri' => '/', 'prepend' => '', 'cases' => $cases], JSON_THROW_ON_ERROR));
            fclose($pipes[0]);
            $output = stream_get_contents($pipes[1]);
            $errors = stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            self::assertSame(0, proc_close($process), $errors);
            self::assertSame('', $errors);
            $results = json_decode($output, true, 512, JSON_THROW_ON_ERROR);
            foreach($expected as $name => $allowed) {
                self::assertSame($allowed, $results[$name], $name);
            }
        } finally {
            foreach(array_reverse($directories) as $directory) {
                rmdir($directory);
            }
        }
    }
}
