# MVT Proxy Server - NestJS

A modern NestJS application with a clean, scalable architecture and a simple Hello World service.

## 🚀 Features

- **NestJS Framework**: Built with the latest NestJS framework for scalable Node.js applications
- **TypeScript**: Full TypeScript support with strict type checking
- **Clean Architecture**: Well-organized directory structure following NestJS best practices
- **Testing**: Comprehensive testing setup with Jest for unit and e2e tests
- **Code Quality**: ESLint and Prettier configuration for consistent code style
- **Hello World Service**: Simple demonstration service with REST endpoints

## 📁 Project Structure

```
src/
├── hello/                    # Hello module
│   ├── hello.controller.ts   # HTTP controller
│   ├── hello.service.ts      # Business logic service
│   ├── hello.module.ts       # Module configuration
│   └── *.spec.ts            # Unit tests
├── app.module.ts             # Root application module
└── main.ts                   # Application entry point

test/
├── jest-e2e.json            # E2E test configuration
└── app.e2e-spec.ts          # End-to-end tests

Configuration files:
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── nest-cli.json            # NestJS CLI configuration
├── .eslintrc.js             # ESLint rules
└── .prettierrc              # Prettier formatting rules
```

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```
The application will be available at `http://localhost:3000`

### Production Mode
```bash
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:cov
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 📡 API Endpoints

### Hello World Service

- `GET /hello` - Returns "Hello World!"
- `GET /hello/:name` - Returns "Hello {name}!"

### Example Usage

```bash
# Get hello world message
curl http://localhost:3000/hello

# Get personalized hello message
curl http://localhost:3000/hello/John
```

## 🔧 Development

### Code Formatting
```bash
npm run format
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## 📚 NestJS Concepts Used

- **Modules**: Organize code into logical units
- **Controllers**: Handle HTTP requests
- **Services**: Contain business logic
- **Dependency Injection**: Automatic service instantiation
- **Decorators**: Define metadata for classes and methods

## 🌟 Best Practices Implemented

1. **Separation of Concerns**: Controllers handle HTTP, services handle business logic
2. **Dependency Injection**: Services are automatically injected where needed
3. **Module Organization**: Clear module structure for scalability
4. **Testing**: Comprehensive test coverage for all components
5. **Code Quality**: ESLint and Prettier for consistent code style
6. **Type Safety**: Full TypeScript support with proper typing

## 🚀 Next Steps

To extend this application:

1. **Add New Modules**: Create new feature modules following the same pattern
2. **Database Integration**: Add TypeORM or Mongoose for data persistence
3. **Authentication**: Implement JWT or Passport authentication
4. **Validation**: Add class-validator for request validation
5. **Documentation**: Integrate Swagger for API documentation
6. **Monitoring**: Add health checks and logging

## 📝 License

This project is licensed under the MIT License.