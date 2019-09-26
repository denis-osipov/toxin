0. 
    ```
    block1
    |
    |___block1.pug
        |
        |___Use: block2


    block2
    |
    |___block2.pug
    |   |
    |   |___Use: block3
    |
    |___block2.scss


    block3
    |
    |___block3.pug
    |   |
    |   |___Use: block4
    |            block5
    |
    |___block3.scss
    |
    |___block3.js


    block4
    |
    |___block4.scss


    block5
    |
    |___block5.js
    ```