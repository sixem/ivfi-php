<h1 align="center">Setup</h1>
<p align="center">How to set up and use the Indexer</p>

</br>

## Download

<p>Download the latest release <a href="https://github.com/sixem/ivfi-php/releases">HERE</a>!</p>
<p>Alternatively, you can also build it from source yourself, for that see: <a href="#building">building</a></p>
<p>You can also find every release and specific builds here: <a href="https://git.five.sh/ivfi/releases/php/">https://git.five.sh/ivfi/releases/php/</a></p>

## Files

You can choose between having a **default** setup and a **standalone** setup.

The default setup will import assets (`js`, `css` and fonts) as separate files, like most sites. This is the normal setup.

The standalone setup will have all of these files bundled directly into the `.php` file instead, serving everything through HTML.

### a) Default
Place the files from the `build` directory into your root web directory.
### b) Standalone (single file)
Place the file from the `standalone` directory into your root web directory.

## Server Configuration

The Indexer does require you to use it as an `index` file, that way it can be automatically applied to directories that do not have a defualt `index` file present. This makes it behave just like any other default and built-in directory indexes. This can all be done easily by following the steps below, **depending** on what web server you are using.

### Nginx
To use this script for all directories without a default index you need append `/indexer.php` to the end of your `index` line in your server configuration. This will tell Nginx to use the Indexer if none of the default indexes exist.

Example usage:
```conf
server {
        index index.html index.php /indexer.php;
}

```
Another example, here it is only being applied to a few directories:
```conf
server {
        location ~ ^/(videos|images)/ {
                index /indexer.php;
        }
}

```
### Apache
In order to automatically use this script as a default index, you need to edit your Apache configuration. To do this, you must place `/indexer.php` at the end of your `DirectoryIndex` directive.

Example usage:

```conf
DirectoryIndex index.html index.php /indexer.php
```

This line can be placed in either your server's `.conf` file or your `.htaccess` file. This will tell Apache to use the Indexer if none of the default indexes exist. This can be set globally or on a per-directory basis depending on your usecase.

## Docker
The script can also be run through a simple docker container using `docker compose`.
#### Clone the repository and install dependencies:
`npm install` can be skipped if you are manually creating `docker/public` without building from source.
```bash
git clone https://github.com/sixem/ivfi-php
cd ivfi-php
npm install
```

#### Build and populate the docker directory:
This is not required as it can be done manually by simply placing the Indexer files in `docker/public`. This command will however build it from source and place the files there automatically. 

This directory (`docker/public`) will serve as the root path of the webserver from where we serve the script.
```bash
npm run docker-populate
```

#### Edit the configuration:
Find `docker/.env.local` and edit it to fit your liking:

`SERVEPOINT` is the root directory containing files that should be browsable and `PORT` are the ports being used.

Any Indexer configurations can be placed in `docker/config.php` prior to starting the container.

#### Run the container:
```bash
cd docker
docker compose --env-file .env.local up
```
The script should now be running on `http://localhost:8080/` if you are using the default ports. You can also add a `-d` flag to the command in order to run the container in detached mode.