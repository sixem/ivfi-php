<h1 align="center">
  <img src="./logo.svg">
</h1>

<h3 align="center">
  <span>The image and video friendly Indexer</span><br>
</h3>

<p align="center">
<a href="https://github.com/sixem/ivfi-php/releases"><img alt="GitHub releases" src="https://img.shields.io/github/v/release/sixem/ivfi-php?color=2f394f&style=flat"></a> <img alt="GitHub issues" src="https://img.shields.io/github/issues/sixem/ivfi-php?color=5a8f4e&style=flat"> <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/sixem/ivfi-php?color=4b8b72&style=flat"> 
<img alt="Travis (.com)" src="https://img.shields.io/travis/com/sixem/ivfi-php?style=flat">
</p>

---

## Introduction

This is a file directory browser script written in PHP and JavaScript.

This is designed to be a image and video friendly Indexer, while also being an Indexer that has all of the other features that you can expect from most directory listers out there. It can be heavily customized, and has a design that attempts to be appealing while also being functional and easy to use.

***Note: The Indexer can be used without JavaScript, but it is needed for the extra functionality.***

## Feedback <!-- {docsify-ignore} -->
I'm open for any feedback.

You can open an [issue](https://github.com/sixem/ivfi-php/issues) if you encounter any **specific** problems or bugs of any kind.

Or, you can start a [discussion](https://github.com/sixem/ivfi-php/discussions) if you just have any general questions or minor issues you want to troubleshoot. You can also suggest any features or potential changes there.

## Demo

You can visit the [demo](https://five.sh/demo/indexer/) to view the indexer in action.

## Features
#### **Authentication**
The script supports HTTP authentication, allowing you to add a bit of protection to your directories.
#### **Gallery Mode**
A gallery mode where you can view images and videos of the current directory without needing to visit each URL separately. It has support for downloading files and reverse searching images.
#### **Hover Previews**
Displays a preview of the image or video when hovering over the name.
#### **Search Filter**
The search filter can be used to search for filenames or filetypes in the current directory.

Usage (Desktop): `Shift + F`.
#### **Single file**
This script can be set up as a single file script (standalone setup). Only one file needed, nothing more.
#### **Customizable**
This script can be customized in a number of ways. (See: [Configuration](config.md))
#### **Additonal Features**
It can be built with additional features, like support for displaying `README.md` files on each directory!
#### **And much more ..**
+ All dates will match the timezone of the client.
+ Persistent client-set sorting settings.
+ Support for custom themes.
+ Server-side filtering which can help you hide specific files or folders.
+ Paths can be clicked, allowing for easy navigation between folders.
+ The client can set their own settings in the menu.
+ Direct download links.
+ Mobile friendly.

## Additional features <!-- {docsify-ignore} -->

When building the Indexer, additional features can be enabled. These features are not bundled with the pre-built releases, and must be flagged as enabled prior to building the Indexer yourself (see below for how the building process is done).

The reason why these features are not included in the default version, is because they may rely on larger libraries and other scripts, which I don't feel should be pushed into the vanilla version unless the user desires to do so themselves!

See [extra features](extras.md) for a list over the features and how these can be implemented.

## Contributing
You can contribute by either submitting a pull request, reporting issues or bugs, or voicing good ideas. It's all very much welcome!

## License
This project is licensed under GPL-3.0.

It also includes external libraries that are available under a variety of licenses.

See [LICENSE](https://github.com/sixem/ivfi-php/blob/master/LICENSE) for the full license text.

## Disclaimer
**As you with anything else, use this script at your own risk. There may exist bugs that i do not know of.**