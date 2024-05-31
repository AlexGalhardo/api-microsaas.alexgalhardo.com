<div align="center">
 <h1 align="center"><a href="https://api-microsaas.alexgalhardo.com" target="_blank">api-microsaas.alexgalhardo.com</a></h1>
</div>

## Introduction

* NestJS REST API to process .xlsx and .csv data for <https://github.com/AlexGalhardo/microsaas.alexgalhardo.com>

## Prerequisites
- Have **bun** isntalled: <https://bun.sh/docs/installation>

## Development Setup Local

1. Clone this repository
```bash
git clone https://github.com/AlexGalhardo/api-microsaas.alexgalhardo.com
```

2. Enter repository
```bash
cd api-microsaas.alexgalhardo.com/
```

3. Run setup.sh
```bash
chmod +x setup.sh && ./setup.sh
```

## Testing
- Make a POST Http Request to: <http://localhost:3000/file>
- Send the data_test_excel.xlsx or .csv as body as Multipart Format with file name: **file** like the prints below

<img width="1235" alt="Screenshot 2024-05-31 at 17 27 49" src="https://github.com/AlexGalhardo/microsaas.alexgalhardo.com/assets/19540357/1d9da88b-5345-41cd-bc7b-dbe9928c6113">

<img width="1249" alt="Screenshot 2024-05-31 at 17 25 34" src="https://github.com/AlexGalhardo/microsaas.alexgalhardo.com/assets/19540357/dcc7f9ba-5c55-4dc4-801b-086e399e7e1f">


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) January 2024-present, [Alex Galhardo](https://github.com/AlexGalhardo)
