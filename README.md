# PF_backend--coder--oliverzapata

## Pasos para ejecutarlo

- Seleccionar el archivo app.js y abrir en terminal integrada (Es decir abrir la consola)
- Instalar las dependencias ingresando en la consola: npm i
- Colocar el comando: node app.js estándo en la caperta src, si no se está en el carpeta src entonces colocar: node src/app.js
- Abrir en el navegador las rutas http://localhost:8080 para abrir la página de registro

## Pasos para ejecutar los test (test de los métodos de productos, carritos y sesiones)
- Seleccionar el archivo app.js y abrir en terminal integrada (Es decir abrir la consola)
- Si se quiere ejecutar el test de productos se coloca el comando:<br>
npx mocha test/integration/products.integration.test.js
- Si se quiere ejecutar el test de carritos se coloca el comando:<br>
npx mocha test/integration/carts.integration.test.js
- Si se quiere ejecutar el test de sesiones se coloca el comando:<br>
npx mocha test/integration/sessions.integration.test.js

## Guía de rutas (del lado del cliente)

### http://localhost:8080 o http://localhost:8080/login
En esta ruta se iniciará sesión en la página

### http://localhost:8080/register
En esta ruta se registrarán los datos del usuario

## http://localhost:8080/reset
En esta ruta se cambia la contraseña

### http://localhost:8080/ResetPassword
En esta ruta se cambia la contraseña mediante el correo, se pasa el correo en el formulario y luego en ese correo se resivirá un correo de autenticación con un link, pueden pasar 2 casos: 

- si el link expiró te enviará a una página para ingresar otra vez el correo y una vez eso debes ingresar al link otra vez para resetear la contraseña

- si el link no expiró te pasará a la página para resetear la contraseña directamente

### http://localhost:8080/products
En esta ruta se verán todos los productos con paginación con la opción de poder pasar algún producto al carrito, también se pueden ejecutar métodos post y put mediante alguna herramienta como postman y en el navegador se verán los cambios automáticamente mediante la implementación de sockets al método get que muestra la vista de esta ruta

### http://localhost:8080/carts/646b7bbcb035a38e23da5ad8
En esta ruta se pueden ver los productos del carrito en tiempo real al establecerse el id del carrito al final de la ruta, en este caso muestro los productos
dentro del carrito con el id: 646b7bbcb035a38e23da5ad8


## Guía de métodos
En el archivo principal app.js usan 7 routers:

-  app.use("/", viewsProductRouter);    (views.products.js)

- app.use('/api/products', passport.authenticate('jwt', { session: false }), checkRole(['admin', 'premium']), productsRouter);    (products.router.js) 

- app.use('/api/carts', cartsRouter);   (carts.router.js)

- app.use("/api/sessions", sessionsRouter);   (session.router.js)

- app.use("/api/users", usersRouter);   (users.router.js)

- app.use("/", viewsRouter);    (views.router.js)

- app.use("/", logsRouter);   (loggers.login.js)


### Métodos de carts.router.js y products.router.js (métodos ejecutables en postman)
La explicación de los métodos de carritos y productos se puede encontrar en la ruta:<br>
http://localhost:8080/api/docs/
 
### Métodos de loggers.login.js (métodos ejecutables en postman)
- Método GET (para probar los logs)<br>
http://localhost:8080/loggerTest<br>

### Métodos de session.router.js (métodos ejecutables en postman)
- Método GET (para ver los detalles del usuario)<br>
http://localhost:8080/api/sessions/current

### Métodos de users.router.js (métodos ejecutables en postman)
- Método GET (para convertir al usuario en premium o en usuario)<br>
http://localhost:8080/api/users/premium/:uid (donde :uid es el id del usuario y ese id se puede ver en el current)

### Métodos de passport.config.js (archivo ubicado en la carpeta de config dentro de src)<br>

- Método register de passport
Contiene la lógica del método POST de registro de sessions.router.js

- Método login de passport
Contiene la lógica del método POST de login de sessions.router.js

- Método de registro con github
Permite registrarse con github

### Métodos de sessions.config.js<br>

- Metódo POST (para registrarse)<br>
http://localhost:8080/register (esta ruta es de la vista el método post de registro se encuentra en session.router.js como router.post '/register')<br>
Con este método se envían los datos del usuario a la base de datos 

- Metódo POST (para iniciar sesión)<br>
http://localhost:8080 o http://localhost:8080/login (esta ruta es de la vista el método post de registro se encuentra en session.router.js como router.post '/login')<br>
Para ingresar los datos de registro y redirigirte luego a la vista de productos (ahora con la opción de registrarse con github)

- Método POST (para cerrar sesión) <br>
http://localhost:8080/api/sessions/logout <br>
Para destruir la sesión (salirse de la sesión)

- Método POST (para reset) <br>
http://localhost:8080/api/sessions/reset <br>
Para cambiar la contraseña de un usuario especificado

- Métodos GET de github <br>
Se añadieron nuevos métodos para poder ver los cambios que se hacen al registrarse con github, estos métodos son:<br>
http://localhost:8080/api/sessions/github<br>
http://localhost:8080/api/sessions/github-callback


### Ruta para ver documentación<br>
- http://localhost:8080/api/docs/

### Ruta para ver administración<br>
- http://localhost:8080/api/manager/
