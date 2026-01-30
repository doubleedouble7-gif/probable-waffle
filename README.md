# Car Spend MY

A Malaysia-focused car spending tracker with multi-car support, receipt uploads, shops, reports, and reminders.

## Features
- Email/password auth with secure hashing
- Track multiple cars
- Expense tracking (petrol, service, insurance, roadtax, and more)
- Receipt uploads (jpg/png/webp, max 5MB)
- Shops/location management
- Reports by month and category
- Reminder system for service, battery, roadtax, and insurance
- Email reminder script for roadtax/insurance

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
```bash
cp .env.example .env
```
Update values in `.env`.

### 3) Run Prisma migration
```bash
npx prisma migrate dev --name init
```

### 4) Start development server
```bash
npm run dev
```
Open http://localhost:3000.

## Reminder email script
```bash
npm run reminders:send
```

### Cron example
```bash
0 8 * * * cd /path/to/repo && /usr/bin/env bash -lc "npm run reminders:send" >> /var/log/carspend_reminders.log 2>&1
```

## Manual test checklist
- [ ] Register a new user
- [ ] Login and logout
- [ ] Add a car
- [ ] Add a shop
- [ ] Add an expense with receipt upload
- [ ] Filter expenses on the dashboard
- [ ] Open expense detail + view receipt
- [ ] Create reminder with preset values
- [ ] Mark reminder as done
- [ ] Review reports page
- [ ] Run reminder email script
