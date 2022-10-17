<h1 align="center">Themes</h1>

<p align="center">Overview and theme usage.</p>


## Overview 
This is an overview over the official themes found in <a href="https://github.com/sixem/eyy-indexer/tree/master/themes">/themes/</a>.


### White

_A simple white theme._

<details>
<summary>Example</summary>
<br>
<img src="https://user-images.githubusercontent.com/20270765/194732001-be63808d-0ea3-44f4-92c6-e7212f6da0f1.png"/>
</details>

---

### Amethyst

_A dark, purple theme based on the colors of the amethyst._

<details>
<summary>Example</summary>
<br>
<img src="https://user-images.githubusercontent.com/20270765/194732093-50c342d9-fa1c-4250-ae8e-700c07ab97a8.png"/>
</details>

---

### Coral

_A turquoise and greenish theme._

<details>
<summary>Example</summary>
<br>
<img src="https://user-images.githubusercontent.com/20270765/194732059-8ebe1ed7-4a9e-4d95-a670-5d59fa22b83d.png"/>
</details>


---

### Ayu-Mirage

_Inspired by the [ayu-mirage](https://github.com/ayu-theme/ayu-colors) theme._

<details>
<summary>Example</summary>
<br>
<img src="https://user-images.githubusercontent.com/20270765/194732069-494bec9d-0354-454d-ba26-a62b93371296.png"/>
</details>

---

### Gruvbox

_Inspired by the classic vim theme [gruvbox](https://github.com/morhetz/gruvbox)._

<details>
<summary>Example</summary>
<br>
<img src="https://user-images.githubusercontent.com/20270765/194732076-cd107582-0033-455f-8e53-e24fd8a27e07.png"/>
</details>


<br />

## Usage
* 1) Download the themes from the <a href="https://github.com/sixem/eyy-indexer/tree/master/themes">folder</a> that you wish to use.
* 2) Place them in a publicly available directory.
    * Example: `/indexer/css/themes/`
* 3) Edit the configuration:
    * Set the `path` to the relative directory of the themes.
    * If you want a theme to be the default, then set `default` to the theme's name.
```php
<?php
return array(
    'style' => array(
        'themes' => array(
            'path' => 'indexer/css/themes',
            'default' => false
        )
    )
);
?>
```
* 4) You should now be able to enable different themes in the settings menu (⚙️ in the top right corner).

## Got anything to add? <!-- {docsify-ignore} -->

If you've created a nice theme, feel free to submit it via a pull request!

<i>PS: Themes can be created by simply modifying any existing CSS values.</i>