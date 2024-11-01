# PostCSS For Plugin
[![Lint, Test, build](https://github.com/lacrioque/postcss-for-es/actions/workflows/linttestbuild.yml/badge.svg?branch=master)](https://github.com/lacrioque/postcss-for-es/actions/workflows/linttestbuild.yml)
[![NPM Version](https://img.shields.io/npm/v/postcss-for-es)](https://www.npmjs.com/package/postcss-for-es)
[![NPM Downloads](https://img.shields.io/npm/dw/postcss-for-es)](https://www.npmjs.com/package/postcss-for-es)
[
    <img align="right" width="135" height="95" src="http://postcss.github.io/postcss/logo-leftp.png" title="Philosopher’s stone, logo of PostCSS">
][PostCSS]

[PostCSS] plugin that enables `@for` loop syntax in your CSS, rewrite in TS and exported as es6 and cjs.

## Try it out!

You can try postcss-for directly from [codepen]. 
Just choose [PostCSS] as a preprocessor and pick desired plugin from the list.

[
    ![lalala](https://raw.githubusercontent.com/lacrioque/postcss-for-es/9a8663762bdb65f94a054926e2eba3b0d8f89c68/resources/codepen.png)
][codepen]

## Changes and Fork

Thanks a lot to [The original](https://github.com/antyakushev/postcss-for), but it was quite aged and didn't support es6. 

I also used the old postcss syntax and in the project I was working on it was very slow (a loooot of loops).

Things that don't work as of yet, but are planned:

- :root selector
- external variables


## Usage

```js
import  postcss from 'postcss';
import  postcssFor from 'postcss-for-es';

export default postcss([ postcssFor() ]);
```

Note, that unlike the Sass `@for`, postcss-for in the example below iterates from 1 to 3 *inclusively*.
```css
@for $i from 1 to 3 {
    .b-$i { width: $(i)px; }
}
```

```css
.b-1 {
    width: 1px
}
.b-2 {
    width: 2px
}
.b-3 {
    width: 3px
}
```

This plugin must be set before [postcss-nested] and [postcss-simple-vars]. 
Therefore dollar variable cannot be used as a loop range parameter.

## More features

`By` keyword is available:

```css
@for $i from 1 to 5 by 2 {
    .b-$i { width: $(i)px; }
}
```

```css
.b-1 {
    width: 1px
}
.b-3 {
    width: 3px
}
.b-5 {
    width: 5px
}
```

Locality of variables in nested loops is supported:
```css
@for $x from 1 to 2 { 
    @for $y from 1 to $x { 
        @for $z from $y to $x { 
            .c-$(x)-$(z)-$(y) { padding: $(x)em $(z)em $(y)em; } 
        }
    }
}
```

```css
.c-1-1-1 {
    padding: 1em 1em 1em
}
.c-2-1-1 {
    padding: 2em 1em 1em
}
.c-2-2-1 {
    padding: 2em 2em 1em
}
.c-2-2-2 {
    padding: 2em 2em 2em
}
```



See [PostCSS] docs for examples for your environment.

[PostCSS]:                   https://github.com/postcss/postcss
[postcss-nested]:            https://github.com/postcss/postcss-nested
[postcss-simple-vars]:       https://github.com/postcss/postcss-simple-vars
[postcss-custom-properties]: https://github.com/postcss/postcss-custom-properties
[postcss-at-rules-variables]:https://github.com/GitScrum/postcss-at-rules-variables
[ci]:                        https://travis-ci.org/antyakushev/postcss-for
[deps]:                      https://gemnasium.com/antyakushev/postcss-for
[npm]:                       http://badge.fury.io/js/postcss-for
[codepen]:                   http://codepen.io/antyakushev/pen/oxOBEO


## Thank you!

(antyakushev)[https://github.com/antyakushev]