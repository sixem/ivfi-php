<h1 align="center">
  <img src="https://raw.githubusercontent.com/sixem/eyy-indexer/master/logo.svg">
</h1>

<h3 align="center">
  <span>An image and video friendly Indexer</span><br>
</h3>

<p align="center">
<a href="https://github.com/sixem/eyy-indexer/releases"><img alt="GitHub releases" src="https://img.shields.io/github/v/release/sixem/eyy-indexer?color=2f394f&style=flat"></a> <img alt="GitHub issues" src="https://img.shields.io/github/issues/sixem/eyy-indexer?color=5a8f4e&style=flat"> <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/sixem/eyy-indexer?color=4b8b72&style=flat"> 
<img alt="Travis (.com)" src="https://img.shields.io/travis/com/sixem/eyy-indexer?style=flat">
</p>

---

## What is this project? :thought_balloon:

This is a file directory browser script written in PHP and TypeScript.

This is designed to be a image and video friendly Indexer, while also being an Indexer that has all of the other features that you can expect from most directory listers out there. It can be heavily customized, and has a design that attempts to be appealing while also being functional and easy to use.

### Demo
* You can visit the [demo](https://five.sh/demo/indexer/) to view the indexer in action.

***Note: The Indexer can be used without JavaScript enabled, but it is needed for the extra functionality.***

## Documentation :blue_book:
:link: [https://sixem.github.io/eyy-indexer/](https://sixem.github.io/eyy-indexer/#/README)

## Feedback :bulb:
I'm open for any feedback.

You can open an [issue](https://github.com/sixem/eyy-indexer/issues) if you encounter any **specific** problems or bugs of any kind.

Or, you can start a [discussion](https://github.com/sixem/eyy-indexer/discussions) if you just have any general questions or minor issues you want to troubleshoot. You can also suggest any features or potential changes there.

## Features

### **Authentication**
The script supports HTTP authentication, allowing you to add a bit of protection to your directories.
### **Gallery Mode**
A gallery mode where you can view images and videos of the current directory without needing to visit each URL separately. It has support for downloading files and reverse searching images.
### **Hover Previews**
Displays a preview of the image or video when hovering over the name.
### **Search Filter**
The search filter can be used to search for filenames or filetypes in the current directory.

Usage (Desktop): `Shift + F`.
### **Single file**
This script can be set up as a single file script (standalone setup). Only one file needed, nothing more.
### **Customizable**
This script can be customized in a number of ways.
### **Additonal Features**
It can be built with additional features, like support for displaying `README.md` files on each directory!
### **And much more ..**
+ :clock12: All dates will match the timezone of the client.
+ :arrow_up_down: Persistent client-set sorting settings.
+ :art: Support for custom themes.
+ :scissors: Server-side filtering which can help you hide specific files or folders.
+ :link: Paths can be clicked, allowing for easy navigation between folders.
+ :gear: The client can set their own settings in the menu.
+ :small_red_triangle_down: Direct download links.
+ :desktop_computer: Works well and both mobile and desktop.

## Quick setup

#### Download the latest release [here](https://github.com/sixem/eyy-indexer/releases).

* Place the `/build/` files into your web root.
* Use the `indexer.php` as a index file for any of the directories where the script should be used:

#### Example (Nginx)
```
server {
        index index.html index.php /indexer.php;
}
```

#### Example (Apache)
```
DirectoryIndex index.html index.php /indexer.php
```

For a more in-depth explanation of how to set up the script, see [setup](https://sixem.github.io/eyy-indexer/#/setup).

You can also find every release and specific builds here: [https://five.sh/releases/eyy-indexer/](https://five.sh/releases/eyy-indexer/)

## Configuration

See [configuration](https://sixem.github.io/eyy-indexer/#/config) for a detailed overview over how this script can be customized.

## Building

You can build the script from source yourself, for that see [building](https://sixem.github.io/eyy-indexer/#/building).

## Contributing
You can contribute by either submitting a pull request, reporting issues or bugs, or voicing good ideas. It's all very much welcome! :relaxed:

## License
This project is licensed under GPL-3.0.

It also includes external libraries that are available under a variety of licenses. See [LICENSE](LICENSE) for the full license text.

## Disclaimer
**As you with anything else, use this script at your own risk. There may exist bugs that i do not know of.**