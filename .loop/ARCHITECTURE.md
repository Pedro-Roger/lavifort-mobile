# Arquitetura — LarviFort Mobile CRM

- **Stack**: Expo (React Native), TypeScript, Expo Router, NativeWind / Tailwind Tokens, Phosphor Icons.
- **Offline-First Engine**: Local SQLite/Storage + Zustand Store + Outbox FIFO Mutation Queue + NetInfo monitor.
- **Backend API**: lavifort-API (NestJS), consumindo `/tasks`, `/tasks/projects`, `/tasks/:id/status`, `/tasks/:id/transfer`, `/auth/login`.
- **Design System**: Cores brand-600 (`#0284c7`), neutral background (`#fcfcfd`), status badges idênticos ao web.
