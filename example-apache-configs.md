These are basic setup examples of what an Apache config could look like.

#### Using the DirectoryIndex (Recommended).

```
<VirtualHost *:80>
    ServerName website.com
    ServerAlias www.website.com

    DocumentRoot "/var/www/website/public"
    DirectoryIndex index.php index.html index.htm /indexer.php
</VirtualHost>
```

#### Using rewrites to redirect all directories without an index (php, html and htm) to the Indexer.

```
<VirtualHost *:80>
    ServerName website.com
    ServerAlias www.website.com

    DocumentRoot "/var/www/website/public"
    DirectoryIndex index.php index.html index.htm
    
    RewriteEngine On
    
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME}/index\.(php|html|htm) !-f
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} -d
    RewriteRule ^/(.*)$ /indexer.php?dir=$1 [QSA,L]
</VirtualHost>
```


#### Using rewrites to redirect a selection of directories lacking an index (php, html and htm) to the Indexer while also disabling direct access to the Indexer.
This will only enable it for the selected directories: `/images`, `/videos` and `/a/directory`

```
<VirtualHost *:80>
    ServerName website.com
    ServerAlias www.website.com

    DocumentRoot "/var/www/website/public"
    DirectoryIndex index.php index.html index.htm
    
    RewriteEngine On

    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME}/index\.(php|html|htm) !-f
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} -d
    RewriteRule ^/((?:images|videos|a/directory)/?(.*))$ /indexer.php?dir=$1 [QSA,L]

    RewriteRule ^/indexer.php(.*)$ - [R=404,L]
</VirtualHost>
```