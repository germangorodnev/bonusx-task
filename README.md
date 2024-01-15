<p align="center">
  <a href="https://bonusx.it/" target="blank"><img src="https://bonusx.it/wp-content/uploads/2021/12/cropped-header_2022.png" width=400" alt="Bonusx Logo" /></a>
</p>

# bx-file-transfer-service

## Important notes
1. S3-ninja has auth issues, therefore you should manually create a **public** bucket `local` using [UI](http://localhost:9000/ui)
2. Tests may not work in Docker env, consider running them in your OS.

## Index

- [Description](#description)
- [Running](#running)
- [Test](#test)

## <a id="description">🔗</a> Description

Repository based on [Nest](https://github.com/nestjs/nest) framework with typescript.

The repository serves as a template for microservices and communicates with other services/microservices through a message broker.

## Batteries included

The message broker is included for development purposes. In production, it should be an external instance.

## <a id="running">🔗</a> Running

```bash
# service run in watch mode
docker-compose up -d

# stop all
docker-compose down
```

## <a id="test">🔗</a> Test

```bash
# unit tests
docker-compose exec -it bx_file_transfer_service yarn test

```

## <a id="license">🔗</a> License

[GPL-3.0 license](LICENSE)

---
