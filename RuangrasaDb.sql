-- ==========================================================================================
-- SCRIPT DATABASE: RuangrasaDb
-- Target DBMS     : Microsoft SQL Server / SQL Server Management Studio (SSMS)
-- Project         : Ruang Rasa Coffee Shop Web Application (S1 Fullstack Project)
-- Arsitektur      : ASP.NET Web Application MVCS (Model, View, Controller, Service) & REST API
--
-- KEPATUHAN SPESIFIKASI PROYEK S1 (PDF):
-- 1. Minimal 6 tabel utama: 
--    - Roles, Users, DiningTables, Categories, Menus, Orders, OrderItems, Payments, Deliveries, RefreshTokens (10 Tabel)
-- 2. Memenuhi 4 Tipe Relasi Database:
--    - One-to-One   : Orders (1) <---> Deliveries (1) [FK OrderId UNIQUE di Deliveries]
--    - One-to-Many  : Categories (1) <---> Menus (N), Users (1) <---> Orders (N)
--    - Many-to-One  : Menus (N) <---> Categories (1), Orders (N) <---> DiningTables (1)
--    - Many-to-Many : Orders (M) <---> OrderItems (Junction) <---> Menus (N)
-- 3. Primary Key & Foreign Key berelasi kuat dengan normalisasi hingga 3NF.
-- 4. Timestamp: Setiap tabel memiliki CreatedAt dan UpdatedAt.
-- 5. Soft Delete: Diterapkan pada 4 tabel utama (Menus, DiningTables, Categories, Users)
--    dengan kolom `IsDeleted BIT DEFAULT 0` dan `DeletedAt DATETIME2 NULL`.
-- 6. 6 Role Lengkap: Admin, Owner, Kasir, Dapur, Driver, Customer.
-- 7. Seed Data: Minimal 20 data awal untuk setiap tabel utama (Users, DiningTables, Categories, Menus, Orders, OrderItems, Payments)!
-- ==========================================================================================

USE master;
GO

-- 1. Buat Database jika belum ada
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'RuangrasaDb')
BEGIN
    CREATE DATABASE RuangrasaDb;
    PRINT '>> Database RuangrasaDb berhasil dibuat.';
END
ELSE
BEGIN
    PRINT '>> Database RuangrasaDb sudah ada, menggunakan database yang tersedia.';
END
GO

USE RuangrasaDb;
GO

-- ==========================================================================================
-- 2. TABEL: Roles (Master 6 Role Sistem)
-- ==========================================================================================
IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        RoleId INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL
    );
    PRINT 'Tabel Roles berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 3. TABEL: Users (Pengguna Sistem & Pelanggan)
-- Menerapkan Soft Delete: IsDeleted, DeletedAt
-- ==========================================================================================
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserId INT IDENTITY(1,1) PRIMARY KEY,
        RoleId INT NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(100) NOT NULL UNIQUE,
        PhoneNumber NVARCHAR(25) NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        AvatarUrl NVARCHAR(500) NULL,
        IsActive BIT DEFAULT 1 NOT NULL,
        IsDeleted BIT DEFAULT 0 NOT NULL,
        DeletedAt DATETIME2 NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(RoleId)
    );
    PRINT 'Tabel Users berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 4. TABEL: DiningTables (Meja Makan Dine-In)
-- Menerapkan Soft Delete: IsDeleted, DeletedAt
-- ==========================================================================================
IF OBJECT_ID(N'dbo.DiningTables', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DiningTables (
        TableId INT IDENTITY(1,1) PRIMARY KEY,
        TableNumber NVARCHAR(20) NOT NULL UNIQUE,
        Capacity INT NOT NULL DEFAULT 2,
        LocationArea NVARCHAR(50) DEFAULT 'Indoor' NOT NULL, -- 'Indoor', 'Outdoor', 'Smoking Area', 'VIP Room'
        Status NVARCHAR(20) NOT NULL DEFAULT 'Available',    -- 'Available', 'Occupied', 'Reserved', 'Maintenance'
        QrCode NVARCHAR(255) NULL,
        IsDeleted BIT DEFAULT 0 NOT NULL,
        DeletedAt DATETIME2 NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT CHK_DiningTables_Status CHECK (Status IN ('Available', 'Occupied', 'Reserved', 'Maintenance'))
    );
    PRINT 'Tabel DiningTables berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 5. TABEL: Categories (Kategori Menu)
-- Menerapkan Soft Delete: IsDeleted, DeletedAt
-- ==========================================================================================
IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories (
        CategoryId INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName NVARCHAR(100) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        IconUrl NVARCHAR(500) NULL,
        DisplayOrder INT DEFAULT 0 NOT NULL,
        IsActive BIT DEFAULT 1 NOT NULL,
        IsDeleted BIT DEFAULT 0 NOT NULL,
        DeletedAt DATETIME2 NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL
    );
    PRINT 'Tabel Categories berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 6. TABEL: Menus (Daftar Menu Makanan & Minuman)
-- Menerapkan Soft Delete: IsDeleted, DeletedAt
-- Relasi Many-to-One ke Categories
-- ==========================================================================================
IF OBJECT_ID(N'dbo.Menus', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Menus (
        MenuId INT IDENTITY(1,1) PRIMARY KEY,
        CategoryId INT NOT NULL,
        Name NVARCHAR(150) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Price DECIMAL(18,2) NOT NULL,
        ImageUrl NVARCHAR(500) NULL,
        IsAvailable BIT DEFAULT 1 NOT NULL,
        Stock INT DEFAULT 100 NOT NULL,
        IsDeleted BIT DEFAULT 0 NOT NULL,
        DeletedAt DATETIME2 NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Menus_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(CategoryId)
    );
    PRINT 'Tabel Menus berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 7. TABEL: Orders (Header Pesanan Transaksi)
-- Menghubungkan Customer, Meja (jika Dine-In), Kasir, Dapur, dan Driver
-- ==========================================================================================
IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        OrderId INT IDENTITY(1,1) PRIMARY KEY,
        OrderNumber NVARCHAR(40) NOT NULL UNIQUE,
        CustomerId INT NOT NULL,
        GuestName NVARCHAR(150) NULL,                 -- Nama lengkap pemesan untuk tamu (Guest Dine-In)
        OrderType NVARCHAR(20) NOT NULL,              -- 'DineIn', 'TakeAway', 'Delivery'
        TableId INT NULL,                             -- Terisi jika DineIn, NULL jika TakeAway / Delivery
        CashierId INT NULL,                           -- Kasir yang memvalidasi/menerima pembayaran
        KitchenStaffId INT NULL,                      -- Petugas dapur/barista yang meracik
        DriverId INT NULL,                            -- Driver yang mengantar (Delivery)
        WaiterId INT NULL,                            -- Waiter yang mengantar ke meja / serah terima counter
        DeliveryAddress NVARCHAR(500) NULL,
        DeliveryContactPhone NVARCHAR(25) NULL,
        DeliveryFee DECIMAL(18,2) DEFAULT 0.00 NOT NULL,
        Subtotal DECIMAL(18,2) NOT NULL,
        Tax DECIMAL(18,2) DEFAULT 0.00 NOT NULL,      -- PPN 10% / 11%
        Discount DECIMAL(18,2) DEFAULT 0.00 NOT NULL,
        TotalAmount DECIMAL(18,2) NOT NULL,
        OrderStatus NVARCHAR(30) NOT NULL DEFAULT 'PendingPayment',
        -- 'PendingPayment', 'WaitingConfirmation', 'Confirmed', 'Cooking', 'Ready', 'ReadyToServe', 'ReadyForPickup', 'ReadyForDelivery', 'Delivering', 'Delivered', 'Completed', 'Cancelled'
        CancelReason NVARCHAR(255) NULL,
        PaymentProofUrl NVARCHAR(500) NULL,
        Notes NVARCHAR(500) NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Orders_Customer FOREIGN KEY (CustomerId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Orders_Table FOREIGN KEY (TableId) REFERENCES dbo.DiningTables(TableId),
        CONSTRAINT FK_Orders_Cashier FOREIGN KEY (CashierId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Orders_Kitchen FOREIGN KEY (KitchenStaffId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Orders_Driver FOREIGN KEY (DriverId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Orders_Waiter FOREIGN KEY (WaiterId) REFERENCES dbo.Users(UserId),
        CONSTRAINT CHK_Orders_OrderType CHECK (OrderType IN ('DineIn', 'TakeAway', 'Delivery')),
        CONSTRAINT CHK_Orders_OrderStatus CHECK (OrderStatus IN (
            'PendingPayment', 'WaitingConfirmation', 'Confirmed', 'Processing', 'Cooking', 'Ready', 'ReadyToServe', 'ReadyForPickup', 'ReadyForDelivery', 'Delivering', 'Delivered', 'Completed', 'Cancelled'
        ))
    );
    PRINT 'Tabel Orders berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 8. TABEL: OrderItems (Junction Many-to-Many antara Orders dan Menus)
-- ==========================================================================================
IF OBJECT_ID(N'dbo.OrderItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderItems (
        OrderItemId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        MenuId INT NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        UnitPrice DECIMAL(18,2) NOT NULL,
        SubtotalPrice AS (Quantity * UnitPrice) PERSISTED,
        Notes NVARCHAR(255) NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Menus FOREIGN KEY (MenuId) REFERENCES dbo.Menus(MenuId)
    );
    PRINT 'Tabel OrderItems berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 9. TABEL: Payments (Pencatatan Pembayaran Transaksi)
-- ==========================================================================================
IF OBJECT_ID(N'dbo.Payments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        PaymentId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        PaymentMethod NVARCHAR(30) NOT NULL,                  -- 'Cash', 'QRIS', 'Transfer', 'DebitCard'
        PaymentStatus NVARCHAR(30) NOT NULL DEFAULT 'Pending',-- 'Pending', 'Paid', 'Failed', 'Refunded'
        AmountPaid DECIMAL(18,2) NOT NULL,
        ChangeAmount DECIMAL(18,2) DEFAULT 0.00 NOT NULL,
        TransactionReference NVARCHAR(100) NULL,
        PaidAt DATETIME2 NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId),
        CONSTRAINT CHK_Payments_Status CHECK (PaymentStatus IN ('Pending', 'Paid', 'Failed', 'Refunded'))
    );
    PRINT 'Tabel Payments berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 10. TABEL: Deliveries (Log Pengantaran Driver)
-- Relasi One-to-One dengan Orders (OrderId UNIQUE)
-- ==========================================================================================
IF OBJECT_ID(N'dbo.Deliveries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Deliveries (
        DeliveryId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL UNIQUE,                          -- Relasi 1-to-1 dengan Orders
        DriverId INT NOT NULL,
        DeliveryStatus NVARCHAR(30) NOT NULL DEFAULT 'Assigned', 
        -- 'Assigned', 'PickedUp', 'OnTheWay', 'Delivered', 'Failed'
        PickupTime DATETIME2 NULL,
        DeliveredTime DATETIME2 NULL,
        RecipientName NVARCHAR(100) NULL,
        ProofImageUrl NVARCHAR(500) NULL,
        Notes NVARCHAR(255) NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Deliveries_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId),
        CONSTRAINT FK_Deliveries_Driver FOREIGN KEY (DriverId) REFERENCES dbo.Users(UserId)
    );
    PRINT 'Tabel Deliveries berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 11. TABEL: RefreshTokens (Mendukung Auth JWT & Refresh Token Sesuai Ketentuan PDF)
-- ==========================================================================================
IF OBJECT_ID(N'dbo.RefreshTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RefreshTokens (
        TokenId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Token NVARCHAR(500) NOT NULL UNIQUE,
        ExpiresAt DATETIME2 NOT NULL,
        IsRevoked BIT DEFAULT 0 NOT NULL,
        ReplacedByToken NVARCHAR(500) NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    );
    PRINT 'Tabel RefreshTokens berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 12. TABEL: PasswordResets (Mendukung Alur Forgot & Reset Password Sesuai Ketentuan PDF)
-- ==========================================================================================
IF OBJECT_ID(N'dbo.PasswordResets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PasswordResets (
        ResetId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Token NVARCHAR(255) NOT NULL UNIQUE,
        ExpiresAt DATETIME2 NOT NULL,
        IsUsed BIT DEFAULT 0 NOT NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_PasswordResets_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    );
    PRINT 'Tabel PasswordResets berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 13. TABEL: Reviews (Rating 1-5 Bintang & Ulasan Pelanggan Pasca Pesanan Selesai)
-- ==========================================================================================
IF OBJECT_ID(N'dbo.Reviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reviews (
        ReviewId INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        CustomerId INT NOT NULL,
        Rating INT NOT NULL,                          -- Nilai bintang 1 sampai 5
        ReviewText NVARCHAR(1000) NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Reviews_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId) ON DELETE CASCADE,
        CONSTRAINT FK_Reviews_Users FOREIGN KEY (CustomerId) REFERENCES dbo.Users(UserId),
        CONSTRAINT CHK_Reviews_Rating CHECK (Rating >= 1 AND Rating <= 5)
    );
    PRINT 'Tabel Reviews berhasil dibuat.';
END
GO

-- ==========================================================================================
-- 13. INDEXING UNTUK QUERY SEARCH, FILTERING & SORTING CEPAT
-- ==========================================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_RoleId' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE NONCLUSTERED INDEX IX_Users_RoleId ON dbo.Users(RoleId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE NONCLUSTERED INDEX IX_Users_Email ON dbo.Users(Email);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Menus_CategoryId' AND object_id = OBJECT_ID('dbo.Menus'))
    CREATE NONCLUSTERED INDEX IX_Menus_CategoryId ON dbo.Menus(CategoryId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Menus_IsDeleted' AND object_id = OBJECT_ID('dbo.Menus'))
    CREATE NONCLUSTERED INDEX IX_Menus_IsDeleted ON dbo.Menus(IsDeleted);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DiningTables_Status' AND object_id = OBJECT_ID('dbo.DiningTables'))
    CREATE NONCLUSTERED INDEX IX_DiningTables_Status ON dbo.DiningTables(Status);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_CustomerId' AND object_id = OBJECT_ID('dbo.Orders'))
    CREATE NONCLUSTERED INDEX IX_Orders_CustomerId ON dbo.Orders(CustomerId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_OrderStatus' AND object_id = OBJECT_ID('dbo.Orders'))
    CREATE NONCLUSTERED INDEX IX_Orders_OrderStatus ON dbo.Orders(OrderStatus);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_OrderType' AND object_id = OBJECT_ID('dbo.Orders'))
    CREATE NONCLUSTERED INDEX IX_Orders_OrderType ON dbo.Orders(OrderType);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_TableId' AND object_id = OBJECT_ID('dbo.Orders'))
    CREATE NONCLUSTERED INDEX IX_Orders_TableId ON dbo.Orders(TableId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payments_OrderId' AND object_id = OBJECT_ID('dbo.Payments'))
    CREATE NONCLUSTERED INDEX IX_Payments_OrderId ON dbo.Payments(OrderId);
GO

-- ==========================================================================================
-- 14. SEED DATA AWAL (MEMENUHI SYARAT PDF: MINIMAL 20 DATA UNTUK SETIAP TABEL UTAMA)
-- ==========================================================================================

-- A. ROLES (7 Role sesuai arsitektur revisi)
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Admin')
BEGIN
    INSERT INTO dbo.Roles (RoleName, Description) VALUES 
    ('Admin', 'Administrator Sistem: Mengelola staf (kasir, dapur, waiter, driver), master data meja, menu & kategori'),
    ('Owner', 'Pemilik Coffee Shop: Memantau dashboard eksekutif, analitik penjualan, omset & performa staf'),
    ('Kasir', 'Petugas Kasir: Menerima dan memvalidasi pembayaran pesanan, kelola status meja, cetak struk POS'),
    ('Dapur', 'Kitchen & Barista: Memantau tiket pesanan masuk, meracik makanan/minuman, update status siap'),
    ('Waiter', 'Pramusaji / Waiter: Mengantar pesanan dine-in ke meja pelanggan dan membantu serah terima di counter'),
    ('Driver', 'Kurir Pengantaran: Mengantar pesanan delivery, update status log perjalanan & serah terima'),
    ('Customer', 'Pelanggan / Pembeli: Registrasi akun, browsing menu, reservasi meja dine-in, takeaway, delivery');
    PRINT 'Seed data Roles (7 Role) berhasil ditambahkan.';
END
GO

-- B. USERS (23 Users: 2 Admin, 2 Owner, 3 Kasir, 3 Dapur, 1 Waiter, 2 Driver, 10 Customers)
-- Memenuhi syarat minimal 20 data per tabel utama
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'admin@ruangrasa.com')
BEGIN
    DECLARE @RAdmin INT = (SELECT RoleId FROM dbo.Roles WHERE RoleName = 'Admin');
    DECLARE @ROwner INT = (SELECT RoleId FROM dbo.Roles WHERE RoleName = 'Owner');
    DECLARE @RKasir INT = (SELECT RoleId FROM dbo.Roles WHERE RoleName = 'Kasir');
    DECLARE @RDapur INT = (SELECT RoleId FROM dbo.Roles WHERE RoleName = 'Dapur');
    DECLARE @RWaiter INT = (SELECT RoleId FROM dbo.Roles WHERE RoleName = 'Waiter');
    DECLARE @RDriver INT = (SELECT RoleId FROM dbo.Roles WHERE RoleName = 'Driver');
    DECLARE @RCust INT = (SELECT RoleId FROM dbo.Roles WHERE RoleName = 'Customer');

    INSERT INTO dbo.Users (RoleId, FullName, Email, PhoneNumber, PasswordHash, IsActive, CreatedAt) VALUES
    -- Staf & Pengelola
    (@RAdmin, 'Super Admin Ruang Rasa', 'admin@ruangrasa.com', '081100000001', 'Password123!', 1, SYSUTCDATETIME()),
    (@RAdmin, 'Admin Cabang Pusat', 'admin2@ruangrasa.com', '081100000002', 'Password123!', 1, SYSUTCDATETIME()),
    (@ROwner, 'Hendra Gunawan (Owner)', 'owner@ruangrasa.com', '081100000003', 'Password123!', 1, SYSUTCDATETIME()),
    (@ROwner, 'Dewi Sartika (Co-Owner)', 'owner2@ruangrasa.com', '081100000004', 'Password123!', 1, SYSUTCDATETIME()),
    (@RKasir, 'Siti Rahma (Kasir 1)', 'kasir1@ruangrasa.com', '081100000005', 'Password123!', 1, SYSUTCDATETIME()),
    (@RKasir, 'Ahmad Fauzi (Kasir 2)', 'kasir2@ruangrasa.com', '081100000006', 'Password123!', 1, SYSUTCDATETIME()),
    (@RKasir, 'Nurul Indah (Kasir 3)', 'kasir3@ruangrasa.com', '081100000007', 'Password123!', 1, SYSUTCDATETIME()),
    (@RDapur, 'Budi Pratama (Head Barista)', 'dapur1@ruangrasa.com', '081100000008', 'Password123!', 1, SYSUTCDATETIME()),
    (@RDapur, 'Riko Santoso (Cook/Kitchen)', 'dapur2@ruangrasa.com', '081100000009', 'Password123!', 1, SYSUTCDATETIME()),
    (@RDapur, 'Maya Anggraini (Barista)', 'dapur3@ruangrasa.com', '081100000010', 'Password123!', 1, SYSUTCDATETIME()),
    (@RWaiter, 'Bagus Setiawan (Waiter 1)', 'waiter1@ruangrasa.com', '081100000013', 'Password123!', 1, SYSUTCDATETIME()),
    (@RDriver, 'Andi Saputra (Driver 1)', 'driver1@ruangrasa.com', '081100000011', 'Password123!', 1, SYSUTCDATETIME()),
    (@RDriver, 'Joko Widodo (Driver 2)', 'driver2@ruangrasa.com', '081100000012', 'Password123!', 1, SYSUTCDATETIME()),
    -- Customers (Pelanggan)
    (@RCust, 'Rian Hidayat', 'rian@gmail.com', '081290000001', 'Password123!', 1, SYSUTCDATETIME()),
    (@RCust, 'Siska Amelia', 'siska@gmail.com', '081290000002', 'Password123!', 1, SYSUTCDATETIME()),
    (@RCust, 'Dimas Bagus', 'dimas@gmail.com', '081290000003', 'Password123!', 1, SYSUTCDATETIME()),
    (@RCust, 'Anisa Putri', 'anisa@gmail.com', '081290000004', 'Password123!', 1, SYSUTCDATETIME()),
    (@RCust, 'Fajar Ramadhan', 'fajar@gmail.com', '081290000005', 'Password123!', 1, SYSUTCDATETIME()),
    (@RCust, 'Bella Oktavia', 'bella@gmail.com', '081290000006', 'Password123!', 1, SYSUTCDATETIME()),
    (@RCust, 'Gilang Pratama', 'gilang@gmail.com', '081290000007', 'Password123!', 1, SYSUTCDATETIME()),
    (@RCust, 'Nadia Maharani', 'nadia@gmail.com', '081290000008', 'Password123!', 1, SYSUTCDATETIME()),
    (@RCust, 'Reza Pahlevi', 'reza@gmail.com', '081290000009', 'Password123!', 1, SYSUTCDATETIME()),
    (@RCust, 'Tania Lestari', 'tania@gmail.com', '081290000010', 'Password123!', 1, SYSUTCDATETIME());
    PRINT 'Seed data Users (22 Data) berhasil ditambahkan.';
END
GO

-- C. DINING TABLES (20 Meja: Memenuhi syarat minimal 20 data per tabel utama)
IF NOT EXISTS (SELECT 1 FROM dbo.DiningTables WHERE TableNumber = 'Meja 01')
BEGIN
    INSERT INTO dbo.DiningTables (TableNumber, Capacity, LocationArea, Status, CreatedAt) VALUES
    ('Meja 01', 2, 'Indoor', 'Available', SYSUTCDATETIME()),
    ('Meja 02', 2, 'Indoor', 'Available', SYSUTCDATETIME()),
    ('Meja 03', 2, 'Indoor', 'Available', SYSUTCDATETIME()),
    ('Meja 04', 4, 'Indoor', 'Available', SYSUTCDATETIME()),
    ('Meja 05', 4, 'Indoor', 'Occupied', SYSUTCDATETIME()),
    ('Meja 06', 4, 'Indoor', 'Available', SYSUTCDATETIME()),
    ('Meja 07', 6, 'Indoor', 'Reserved', SYSUTCDATETIME()),
    ('Meja 08', 6, 'Indoor', 'Available', SYSUTCDATETIME()),
    ('Meja 09', 2, 'Outdoor', 'Available', SYSUTCDATETIME()),
    ('Meja 10', 2, 'Outdoor', 'Available', SYSUTCDATETIME()),
    ('Meja 11', 4, 'Outdoor', 'Available', SYSUTCDATETIME()),
    ('Meja 12', 4, 'Outdoor', 'Available', SYSUTCDATETIME()),
    ('Meja 13', 4, 'Outdoor', 'Occupied', SYSUTCDATETIME()),
    ('Meja 14', 6, 'Smoking Area', 'Available', SYSUTCDATETIME()),
    ('Meja 15', 6, 'Smoking Area', 'Available', SYSUTCDATETIME()),
    ('Meja 16', 4, 'Smoking Area', 'Available', SYSUTCDATETIME()),
    ('Meja 17', 2, 'Bar Counter', 'Available', SYSUTCDATETIME()),
    ('Meja 18', 2, 'Bar Counter', 'Available', SYSUTCDATETIME()),
    ('Meja 19 (VIP-1)', 8, 'VIP Room', 'Available', SYSUTCDATETIME()),
    ('Meja 20 (VIP-2)', 10, 'VIP Room', 'Reserved', SYSUTCDATETIME());
    PRINT 'Seed data DiningTables (20 Meja) berhasil ditambahkan.';
END
GO

-- D. CATEGORIES (20 Kategori Menu Lengkap: Memenuhi syarat minimal 20 data per tabel utama)
IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE CategoryName = 'Signature Coffee')
BEGIN
    INSERT INTO dbo.Categories (CategoryName, Description, DisplayOrder, IsActive, CreatedAt) VALUES
    ('Signature Coffee', 'Racikan kopi spesial khas barista Ruang Rasa', 1, 1, SYSUTCDATETIME()),
    ('Espresso Based', 'Kopi konsentrasi tinggi ekstraksi mesin espresso modern', 2, 1, SYSUTCDATETIME()),
    ('Manual Brew Single Origin', 'Kopi seduh manual pour over V60, Kalita, Chemex, Aeropress', 3, 1, SYSUTCDATETIME()),
    ('Cold Brew Series', 'Ekstraksi dingin selama 12-16 jam dengan rasa lembut rendah asam', 4, 1, SYSUTCDATETIME()),
    ('Artisan Tea', 'Pilihan teh daun premium dari perkebunan pilihan', 5, 1, SYSUTCDATETIME()),
    ('Matcha & Green Tea', 'Olahan matcha grade ceremonial dari Uji, Jepang', 6, 1, SYSUTCDATETIME()),
    ('Chocolate & Cocoa', 'Minuman cokelat murni artisan Nusantara', 7, 1, SYSUTCDATETIME()),
    ('Fresh Mocktails', 'Kombinasi soda, buah segar, dan herbal penyegar dahaga', 8, 1, SYSUTCDATETIME()),
    ('Smoothies & Shakes', 'Jus buah asli berpadu susu dan yoghurt segar', 9, 1, SYSUTCDATETIME()),
    ('Plant-Based Milk Drinks', 'Minuman ramah vegan dengan oat milk, soy milk, dan almond milk', 10, 1, SYSUTCDATETIME()),
    ('French Pastry', 'Croissant berlapis renyah dan pain au chocolat hangat', 11, 1, SYSUTCDATETIME()),
    ('Sweet Bakery & Cakes', 'Slice cake, muffin lembut, dan roti cinnamon harum', 12, 1, SYSUTCDATETIME()),
    ('Toast & Sandwiches', 'Roti panggang sourdough dengan isian daging dan keju melimpah', 13, 1, SYSUTCDATETIME()),
    ('Light Bites & Fries', 'Camilan ringan kentang goreng, nachos, dan cireng renyah', 14, 1, SYSUTCDATETIME()),
    ('Indonesian Main Course', 'Hidangan utama tradisional khas nusantara', 15, 1, SYSUTCDATETIME()),
    ('Western Main Course', 'Pasta otentik, steak ayam, dan burger panggang', 16, 1, SYSUTCDATETIME()),
    ('Rice Bowl Specials', 'Nasi hangat dengan topping daging lezat dan saus spesial', 17, 1, SYSUTCDATETIME()),
    ('Breakfast & Brunch', 'Menu sarapan pagi sehat telur, sosis, dan salad segar', 18, 1, SYSUTCDATETIME()),
    ('Healthy Bowls & Salad', 'Salad sayur organik dan acai bowl buah-buahan superfood', 19, 1, SYSUTCDATETIME()),
    ('Ruang Rasa Merchandise', 'Biji kopi sangrai kemasan (beans), tumbler, dan merchandise resmi', 20, 1, SYSUTCDATETIME());
    PRINT 'Seed data Categories (20 Kategori) berhasil ditambahkan.';
END
GO

-- E. MENUS (25 Menu Lengkap: Memenuhi syarat minimal 20 data per tabel utama)
IF NOT EXISTS (SELECT 1 FROM dbo.Menus WHERE Name = 'Kopi Susu Ruang Rasa')
BEGIN
    DECLARE @cSig INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Signature Coffee');
    DECLARE @cEsp INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Espresso Based');
    DECLARE @cMan INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Manual Brew Single Origin');
    DECLARE @cCol INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Cold Brew Series');
    DECLARE @cTea INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Artisan Tea');
    DECLARE @cMat INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Matcha & Green Tea');
    DECLARE @cCho INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Chocolate & Cocoa');
    DECLARE @cMoc INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Fresh Mocktails');
    DECLARE @cPas INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'French Pastry');
    DECLARE @cBak INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Sweet Bakery & Cakes');
    DECLARE @cToa INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Toast & Sandwiches');
    DECLARE @cBit INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Light Bites & Fries');
    DECLARE @cInd INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Indonesian Main Course');
    DECLARE @cWes INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Western Main Course');
    DECLARE @cRic INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Rice Bowl Specials');
    DECLARE @cHea INT = (SELECT CategoryId FROM dbo.Categories WHERE CategoryName = 'Healthy Bowls & Salad');

    INSERT INTO dbo.Menus (CategoryId, Name, Description, Price, ImageUrl, IsAvailable, Stock, CreatedAt) VALUES
    (@cSig, 'Kopi Susu Ruang Rasa', 'Espresso double blend dengan gula aren organik dan susu segar', 22000.00, '/images/kopi-susu.jpg', 1, 200, SYSUTCDATETIME()),
    (@cSig, 'Pandan Coffee Velvet', 'Espresso aromatik dipadu sirup pandan alami dan krim lembut', 26000.00, '/images/pandan-velvet.jpg', 1, 150, SYSUTCDATETIME()),
    (@cSig, 'Caramel Macchiato Rasa', 'Espresso shot berlapis vanilla steamed milk dan saus karamel leleh', 29000.00, '/images/caramel-macchiato.jpg', 1, 120, SYSUTCDATETIME()),
    (@cEsp, 'Caffe Americano Hot/Iced', 'Double shot espresso murni dengan air mineral panas atau dingin segar', 20000.00, '/images/americano.jpg', 1, 200, SYSUTCDATETIME()),
    (@cEsp, 'Caffe Latte Art', 'Espresso klasik dengan susu micro-foam halus dan latte art cantik', 26000.00, '/images/latte.jpg', 1, 180, SYSUTCDATETIME()),
    (@cEsp, 'Cappuccino Cinnamon', 'Espresso pekat, foam tebal lembut, dengan taburan bubuk kayu manis', 27000.00, '/images/cappuccino.jpg', 1, 150, SYSUTCDATETIME()),
    (@cMan, 'V60 Gayo Winey', 'Kopi Arabika Aceh Gayo proses wine dengan notes anggur segar & floral', 32000.00, '/images/v60-gayo.jpg', 1, 80, SYSUTCDATETIME()),
    (@cMan, 'Japanese Iced V60 Flores', 'Seduhan Arabika Bajawa di atas es batu batu kristal dengan aftertaste manis madu', 34000.00, '/images/v60-flores.jpg', 1, 75, SYSUTCDATETIME()),
    (@cCol, 'Signature Nitro Cold Brew', 'Cold brew pekat berbusa nitrogen halus dengan tekstur creamy seperti stout', 30000.00, '/images/nitro-coldbrew.jpg', 1, 60, SYSUTCDATETIME()),
    (@cTea, 'Artisan Berry Hibiscus', 'Seduhan bunga hibiscus, strawberry kering, dan daun teh hijau segar', 24000.00, '/images/berry-tea.jpg', 1, 100, SYSUTCDATETIME()),
    (@cMat, 'Kyoto Matcha Latte', 'Matcha grade seremonial Jepang murni dipadu fresh milk creamy', 28000.00, '/images/matcha-latte.jpg', 1, 110, SYSUTCDATETIME()),
    (@cCho, 'Dark Cocoa Belgium', 'Cokelat hitam Belgia 70% kental manis pas dengan taburan marshmallow', 27000.00, '/images/dark-chocolate.jpg', 1, 90, SYSUTCDATETIME()),
    (@cMoc, 'Sunset Berry Sparkle', 'Mocktail soda dingin dengan sirup blueberry, perasan lemon, dan rosemary', 26000.00, '/images/sunset-mocktail.jpg', 1, 100, SYSUTCDATETIME()),
    (@cPas, 'Butter Croissant Crispy', 'Pastry khas Perancis dengan aroma mentega panggang yang renyah di luar lembut di dalam', 24000.00, '/images/croissant.jpg', 1, 50, SYSUTCDATETIME()),
    (@cBak, 'Almond Cinnamon Roll', 'Roti gulung bumbu kayu manis harum bertabur kacang almond iris panggang', 26000.00, '/images/cinnamon-roll.jpg', 1, 40, SYSUTCDATETIME()),
    (@cToa, 'Smoked Beef Cheese Sourdough', 'Roti sourdough panggang dengan smoked beef, keju cheddar meleleh, dan saus mustard', 36000.00, '/images/beef-toast.jpg', 1, 45, SYSUTCDATETIME()),
    (@cBit, 'Truffle French Fries', 'Kentang goreng renyah bumbu aroma minyak truffle dan taburan keju parmesan', 28000.00, '/images/truffle-fries.jpg', 1, 90, SYSUTCDATETIME()),
    (@cBit, 'Crispy Salt & Pepper Tofu', 'Tahu sutra krispi renyah dengan bumbu lada garam pedas gurih', 22000.00, '/images/crispy-tofu.jpg', 1, 80, SYSUTCDATETIME()),
    (@cInd, 'Nasi Goreng Ruang Rasa', 'Nasi goreng racikan bumbu rempah spesial, ayam suwir, sate lilit, dan telur mata sapi', 38000.00, '/images/nasgor-ruangrasa.jpg', 1, 60, SYSUTCDATETIME()),
    (@cInd, 'Mie Goreng Dok-Dok Jawa', 'Mie kuning tumis kuah nyemek kaya rempah dengan irisan bakso dan sayuran', 35000.00, '/images/mie-dokdok.jpg', 1, 55, SYSUTCDATETIME()),
    (@cWes, 'Spaghetti Aglio e Olio Smoked Beef', 'Pasta al dente ditumis minyak zaitun, bawang putih, cabai kering, dan smoked beef', 42000.00, '/images/spaghetti-aglio.jpg', 1, 50, SYSUTCDATETIME()),
    (@cWes, 'Creamy Carbonara Fettuccine', 'Fettuccine dengan saus krim kuning telur otentik, daging renyah, dan lada hitam', 45000.00, '/images/carbonara.jpg', 1, 45, SYSUTCDATETIME()),
    (@cRic, 'Chicken Katsu Curry Bowl', 'Nasi pulen Jepang disajikan dengan ayam katsu renyah dan kuah kari kental gurih', 39000.00, '/images/katsu-curry.jpg', 1, 50, SYSUTCDATETIME()),
    (@cRic, 'Beef Teriyaki Rice Bowl', 'Irisan daging sapi lembut saus teriyaki manis gurih dengan taburan biji wijen', 44000.00, '/images/beef-teriyaki.jpg', 1, 40, SYSUTCDATETIME()),
    (@cHea, 'Dragon Fruit Smoothie Bowl', 'Mangkuk buah naga dingin berpadu topping chia seed, granola renyah, dan pisang segar', 35000.00, '/images/smoothie-bowl.jpg', 1, 35, SYSUTCDATETIME());
    PRINT 'Seed data Menus (25 Menu) berhasil ditambahkan.';
END
GO

-- F. ORDERS (20 Transaksi Pesanan: Memenuhi syarat minimal 20 data per tabel utama)
IF NOT EXISTS (SELECT 1 FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0001')
BEGIN
    DECLARE @uC1 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'rian@gmail.com');
    DECLARE @uC2 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'siska@gmail.com');
    DECLARE @uC3 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'dimas@gmail.com');
    DECLARE @uC4 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'anisa@gmail.com');
    DECLARE @uC5 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'fajar@gmail.com');
    DECLARE @uC6 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'bella@gmail.com');
    DECLARE @uC7 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'gilang@gmail.com');
    DECLARE @uC8 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'nadia@gmail.com');
    DECLARE @uC9 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'reza@gmail.com');
    DECLARE @uC10 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'tania@gmail.com');

    DECLARE @kKasir1 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'kasir1@ruangrasa.com');
    DECLARE @kDapur1 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'dapur1@ruangrasa.com');
    DECLARE @kDriver1 INT = (SELECT TOP 1 UserId FROM dbo.Users WHERE Email = 'driver1@ruangrasa.com');

    DECLARE @t1 INT = (SELECT TOP 1 TableId FROM dbo.DiningTables WHERE TableNumber = 'Meja 01');
    DECLARE @t2 INT = (SELECT TOP 1 TableId FROM dbo.DiningTables WHERE TableNumber = 'Meja 02');
    DECLARE @t3 INT = (SELECT TOP 1 TableId FROM dbo.DiningTables WHERE TableNumber = 'Meja 03');
    DECLARE @t4 INT = (SELECT TOP 1 TableId FROM dbo.DiningTables WHERE TableNumber = 'Meja 04');
    DECLARE @t5 INT = (SELECT TOP 1 TableId FROM dbo.DiningTables WHERE TableNumber = 'Meja 05');

    INSERT INTO dbo.Orders 
    (OrderNumber, CustomerId, OrderType, TableId, CashierId, KitchenStaffId, DriverId, DeliveryAddress, DeliveryFee, Subtotal, Tax, Discount, TotalAmount, OrderStatus, Notes, CreatedAt)
    VALUES
    ('RR-20260901-0001', @uC1, 'DineIn', @t1, @kKasir1, @kDapur1, NULL, NULL, 0, 48000.00, 4800.00, 0, 52800.00, 'Completed', 'Less sugar untuk kopi', DATEADD(HOUR, -24, SYSUTCDATETIME())),
    ('RR-20260901-0002', @uC2, 'DineIn', @t2, @kKasir1, @kDapur1, NULL, NULL, 0, 55000.00, 5500.00, 5000.00, 55500.00, 'Completed', 'Tolong jangan terlalu panas', DATEADD(HOUR, -23, SYSUTCDATETIME())),
    ('RR-20260901-0003', @uC3, 'TakeAway', NULL, @kKasir1, @kDapur1, NULL, NULL, 0, 60000.00, 6000.00, 0, 66000.00, 'Completed', 'Bungkus terpisah', DATEADD(HOUR, -22, SYSUTCDATETIME())),
    ('RR-20260901-0004', @uC4, 'Delivery', NULL, @kKasir1, @kDapur1, @kDriver1, 'Jl. Melati No. 12, Jakarta', 10000.00, 72000.00, 7200.00, 0, 89200.00, 'Completed', 'Pagar warna hitam', DATEADD(HOUR, -20, SYSUTCDATETIME())),
    ('RR-20260901-0005', @uC5, 'DineIn', @t3, @kKasir1, @kDapur1, NULL, NULL, 0, 44000.00, 4400.00, 0, 48400.00, 'Completed', 'Tambah es batu', DATEADD(HOUR, -19, SYSUTCDATETIME())),
    ('RR-20260901-0006', @uC6, 'DineIn', @t4, @kKasir1, @kDapur1, NULL, NULL, 0, 80000.00, 8000.00, 0, 88000.00, 'Completed', NULL, DATEADD(HOUR, -18, SYSUTCDATETIME())),
    ('RR-20260901-0007', @uC7, 'Delivery', NULL, @kKasir1, @kDapur1, @kDriver1, 'Komp. Graha Indah B3/5', 12000.00, 64000.00, 6400.00, 10000.00, 72400.00, 'Completed', 'Titip di pos sekuriti', DATEADD(HOUR, -17, SYSUTCDATETIME())),
    ('RR-20260901-0008', @uC8, 'TakeAway', NULL, @kKasir1, @kDapur1, NULL, NULL, 0, 52000.00, 5200.00, 0, 57200.00, 'Completed', NULL, DATEADD(HOUR, -15, SYSUTCDATETIME())),
    ('RR-20260901-0009', @uC9, 'DineIn', @t5, @kKasir1, @kDapur1, NULL, NULL, 0, 95000.00, 9500.00, 0, 104500.00, 'Completed', 'Meja smoking area', DATEADD(HOUR, -14, SYSUTCDATETIME())),
    ('RR-20260901-0010', @uC10, 'Delivery', NULL, @kKasir1, @kDapur1, @kDriver1, 'Apartemen Sudirman Tower 1 #12A', 15000.00, 70000.00, 7000.00, 0, 92000.00, 'Completed', 'Hubungi via WA saat sampai', DATEADD(HOUR, -12, SYSUTCDATETIME())),
    ('RR-20260902-0011', @uC1, 'DineIn', @t1, @kKasir1, @kDapur1, NULL, NULL, 0, 48000.00, 4800.00, 0, 52800.00, 'Completed', NULL, DATEADD(HOUR, -10, SYSUTCDATETIME())),
    ('RR-20260902-0012', @uC2, 'TakeAway', NULL, @kKasir1, @kDapur1, NULL, NULL, 0, 50000.00, 5000.00, 0, 55000.00, 'Completed', 'Paper bag ramah lingkungan', DATEADD(HOUR, -8, SYSUTCDATETIME())),
    ('RR-20260902-0013', @uC3, 'DineIn', @t2, @kKasir1, @kDapur1, NULL, NULL, 0, 68000.00, 6800.00, 0, 74800.00, 'Completed', NULL, DATEADD(HOUR, -6, SYSUTCDATETIME())),
    ('RR-20260902-0014', @uC4, 'Delivery', NULL, @kKasir1, @kDapur1, @kDriver1, 'Jl. Kemang Raya No. 44', 10000.00, 85000.00, 8500.00, 0, 103500.00, 'Delivering', 'Antar segera', DATEADD(HOUR, -3, SYSUTCDATETIME())),
    ('RR-20260902-0015', @uC5, 'DineIn', @t5, @kKasir1, @kDapur1, NULL, NULL, 0, 76000.00, 7600.00, 0, 83600.00, 'Cooking', 'Sedang dimasak', DATEADD(HOUR, -2, SYSUTCDATETIME())),
    ('RR-20260902-0016', @uC6, 'TakeAway', NULL, @kKasir1, @kDapur1, NULL, NULL, 0, 38000.00, 3800.00, 0, 41800.00, 'Ready', 'Siap diambil pelanggan', DATEADD(HOUR, -1, SYSUTCDATETIME())),
    ('RR-20260902-0017', @uC7, 'DineIn', @t3, @kKasir1, NULL, NULL, NULL, 0, 54000.00, 5400.00, 0, 59400.00, 'WaitingConfirmation', 'Menunggu konfirmasi dapur', DATEADD(MINUTE, -40, SYSUTCDATETIME())),
    ('RR-20260902-0018', @uC8, 'DineIn', @t4, NULL, NULL, NULL, NULL, 0, 46000.00, 4600.00, 0, 50600.00, 'PendingPayment', 'Menunggu pembayaran di kasir', DATEADD(MINUTE, -20, SYSUTCDATETIME())),
    ('RR-20260902-0019', @uC9, 'TakeAway', NULL, NULL, NULL, NULL, NULL, 0, 35000.00, 3500.00, 0, 38500.00, 'PendingPayment', 'Bayar dengan QRIS nanti', DATEADD(MINUTE, -10, SYSUTCDATETIME())),
    ('RR-20260902-0020', @uC10, 'DineIn', @t1, @kKasir1, @kDapur1, NULL, NULL, 0, 62000.00, 6200.00, 0, 68200.00, 'Cancelled', 'Dibatalkan oleh pelanggan', DATEADD(MINUTE, -5, SYSUTCDATETIME()));
    PRINT 'Seed data Orders (20 Pesanan) berhasil ditambahkan.';
END
GO

-- G. ORDER ITEMS (20+ Rincian Menu Dipesan: Junction Many-to-Many)
IF NOT EXISTS (SELECT 1 FROM dbo.OrderItems WHERE Notes = 'Item-Seed-01')
BEGIN
    DECLARE @ord1 INT = (SELECT TOP 1 OrderId FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0001');
    DECLARE @ord2 INT = (SELECT TOP 1 OrderId FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0002');
    DECLARE @ord3 INT = (SELECT TOP 1 OrderId FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0003');
    DECLARE @ord4 INT = (SELECT TOP 1 OrderId FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0004');
    DECLARE @ord5 INT = (SELECT TOP 1 OrderId FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0005');
    DECLARE @ord6 INT = (SELECT TOP 1 OrderId FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0006');
    DECLARE @ord7 INT = (SELECT TOP 1 OrderId FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0007');
    DECLARE @ord8 INT = (SELECT TOP 1 OrderId FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0008');
    DECLARE @ord9 INT = (SELECT TOP 1 OrderId FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0009');
    DECLARE @ord10 INT = (SELECT TOP 1 OrderId FROM dbo.Orders WHERE OrderNumber = 'RR-20260901-0010');

    DECLARE @m1 INT = (SELECT TOP 1 MenuId FROM dbo.Menus WHERE Name = 'Kopi Susu Ruang Rasa');
    DECLARE @m2 INT = (SELECT TOP 1 MenuId FROM dbo.Menus WHERE Name = 'Pandan Coffee Velvet');
    DECLARE @m3 INT = (SELECT TOP 1 MenuId FROM dbo.Menus WHERE Name = 'Caffe Latte Art');
    DECLARE @m4 INT = (SELECT TOP 1 MenuId FROM dbo.Menus WHERE Name = 'Butter Croissant Crispy');
    DECLARE @m5 INT = (SELECT TOP 1 MenuId FROM dbo.Menus WHERE Name = 'Nasi Goreng Ruang Rasa');
    DECLARE @m6 INT = (SELECT TOP 1 MenuId FROM dbo.Menus WHERE Name = 'Kyoto Matcha Latte');
    DECLARE @m7 INT = (SELECT TOP 1 MenuId FROM dbo.Menus WHERE Name = 'Spaghetti Aglio e Olio Smoked Beef');

    INSERT INTO dbo.OrderItems (OrderId, MenuId, Quantity, UnitPrice, Notes, CreatedAt) VALUES
    (@ord1, @m1, 1, 22000.00, 'Item-Seed-01', SYSUTCDATETIME()),
    (@ord1, @m2, 1, 26000.00, 'Item-Seed-02', SYSUTCDATETIME()),
    (@ord2, @m3, 1, 26000.00, 'Item-Seed-03', SYSUTCDATETIME()),
    (@ord2, @m4, 1, 24000.00, 'Item-Seed-04', SYSUTCDATETIME()),
    (@ord3, @m5, 1, 38000.00, 'Item-Seed-05', SYSUTCDATETIME()),
    (@ord3, @m1, 1, 22000.00, 'Item-Seed-06', SYSUTCDATETIME()),
    (@ord4, @m7, 1, 42000.00, 'Item-Seed-07', SYSUTCDATETIME()),
    (@ord4, @m6, 1, 28000.00, 'Item-Seed-08', SYSUTCDATETIME()),
    (@ord5, @m1, 2, 22000.00, 'Item-Seed-09', SYSUTCDATETIME()),
    (@ord6, @m7, 1, 42000.00, 'Item-Seed-10', SYSUTCDATETIME()),
    (@ord6, @m5, 1, 38000.00, 'Item-Seed-11', SYSUTCDATETIME()),
    (@ord7, @m2, 1, 26000.00, 'Item-Seed-12', SYSUTCDATETIME()),
    (@ord7, @m5, 1, 38000.00, 'Item-Seed-13', SYSUTCDATETIME()),
    (@ord8, @m3, 2, 26000.00, 'Item-Seed-14', SYSUTCDATETIME()),
    (@ord9, @m7, 1, 42000.00, 'Item-Seed-15', SYSUTCDATETIME()),
    (@ord9, @m5, 1, 38000.00, 'Item-Seed-16', SYSUTCDATETIME()),
    (@ord9, @m4, 1, 24000.00, 'Item-Seed-17', SYSUTCDATETIME()),
    (@ord10, @m6, 1, 28000.00, 'Item-Seed-18', SYSUTCDATETIME()),
    (@ord10, @m7, 1, 42000.00, 'Item-Seed-19', SYSUTCDATETIME()),
    (@ord2, @m1, 1, 22000.00, 'Item-Seed-20', SYSUTCDATETIME()),
    (@ord4, @m4, 1, 24000.00, 'Item-Seed-21', SYSUTCDATETIME());
    PRINT 'Seed data OrderItems (21 Rincian) berhasil ditambahkan.';
END
GO

-- H. PAYMENTS (20 Transaksi Pembayaran: Memenuhi syarat minimal 20 data per tabel utama)
IF NOT EXISTS (SELECT 1 FROM dbo.Payments WHERE TransactionReference = 'TRX-PAY-0001')
BEGIN
    INSERT INTO dbo.Payments 
    (OrderId, PaymentMethod, PaymentStatus, AmountPaid, ChangeAmount, TransactionReference, PaidAt, CreatedAt)
    SELECT 
        o.OrderId,
        CASE (o.OrderId % 4) 
            WHEN 0 THEN 'QRIS' 
            WHEN 1 THEN 'Cash' 
            WHEN 2 THEN 'Transfer' 
            ELSE 'DebitCard' 
        END,
        CASE WHEN o.OrderStatus IN ('PendingPayment', 'Cancelled') THEN 'Pending' ELSE 'Paid' END,
        o.TotalAmount,
        0.00,
        CONCAT('TRX-PAY-', RIGHT(CONCAT('0000', o.OrderId), 4)),
        CASE WHEN o.OrderStatus IN ('PendingPayment', 'Cancelled') THEN NULL ELSE SYSUTCDATETIME() END,
        SYSUTCDATETIME()
    FROM dbo.Orders o;
    PRINT 'Seed data Payments (20 Pembayaran) berhasil ditambahkan.';
END
GO

-- I. PROMOS (Voucher Promo & Diskon)
IF OBJECT_ID(N'dbo.Promos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Promos (
        PromoId INT IDENTITY(1,1) PRIMARY KEY,
        PromoCode NVARCHAR(50) NOT NULL UNIQUE,
        Title NVARCHAR(150) NOT NULL,
        Description NVARCHAR(500) NULL,
        DiscountType NVARCHAR(20) DEFAULT 'Percentage' NOT NULL,
        DiscountValue DECIMAL(18,2) NOT NULL,
        MinOrderAmount DECIMAL(18,2) DEFAULT 0.00 NOT NULL,
        MaxDiscountAmount DECIMAL(18,2) NULL,
        BadgeText NVARCHAR(50) DEFAULT 'PROMO' NULL,
        IsActive BIT DEFAULT 1 NOT NULL,
        IsDeleted BIT DEFAULT 0 NOT NULL,
        ExpiryDate DATETIME2 NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        UpdatedAt DATETIME2 NULL,
        DeletedAt DATETIME2 NULL
    );

    INSERT INTO dbo.Promos (PromoCode, Title, Description, DiscountType, DiscountValue, MinOrderAmount, MaxDiscountAmount, BadgeText, IsActive, IsDeleted, CreatedAt)
    VALUES 
    (N'RASABARU', N'Diskon Pelanggan Baru 20%', N'Nikmati diskon 20% untuk semua menu kopi artisan dan pastry pilihan.', N'Percentage', 20.00, 30000.00, 15000.00, N'DISKON 20%', 1, 0, SYSUTCDATETIME()),
    (N'KOPIHEMAT', N'Potongan Kopi Spesial Rp 10.000', N'Hemat langsung Rp 10.000 untuk transaksi kopi favorit Anda.', N'FixedAmount', 10000.00, 40000.00, 10000.00, N'HEMAT 10RB', 1, 0, SYSUTCDATETIME()),
    (N'NGOPIHEMAT', N'Promo Nongkrong Seru 15%', N'Diskon 15% untuk santap di tempat (Dine-In) atau bungkus bersama teman.', N'Percentage', 15.00, 50000.00, 20000.00, N'DISKON 15%', 1, 0, SYSUTCDATETIME()),
    (N'FREESHIP', N'Gratis Ongkir Delivery', N'Potongan biaya pengantaran Rp 10.000 khusus pesanan Delivery ke alamat Anda.', N'FixedAmount', 10000.00, 35000.00, 10000.00, N'FREE ONGKIR', 1, 0, SYSUTCDATETIME());
    PRINT 'Tabel dan seed data Promos berhasil dibuat.';
END
GO

PRINT '====================================================================';
PRINT 'SUKSES: Database RuangrasaDb berhasil dibuat & disiapkan secara penuh!';
PRINT 'Semua spesifikasi S1 (PDF) telah dipenuhi 100%.';
PRINT '====================================================================';
GO

-- ============================================================================
-- J. PROMOS TAMBAHAN (Pelengkap seed minimal 20 data per tabel utama)
-- Idempoten: aman dijalankan berulang, hanya menambah jika jumlah promo < 20.
-- ============================================================================
IF (SELECT COUNT(*) FROM dbo.Promos) < 20
BEGIN
    INSERT INTO dbo.Promos (PromoCode, Title, Description, DiscountType, DiscountValue, MinOrderAmount, MaxDiscountAmount, BadgeText, IsActive, IsDeleted, ExpiryDate, CreatedAt)
    VALUES
    (N'KOPISENJA',   N'Diskon Kopi Sore 10%',        N'Potongan 10% khusus pembelian kopi di jam senja (16.00 - 18.00 WIB).',            N'Percentage',  10.00,  25000.00, 10000.00, N'SENJA 10%',  1, 0, DATEADD(MONTH, 3, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'PASTRY15',    N'Promo Pastry 15%',            N'Diskon 15% untuk seluruh menu pastry panggang segar setiap hari.',                N'Percentage',  15.00,  20000.00, 15000.00, N'PASTRY 15%', 1, 0, DATEADD(MONTH, 3, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'NONAKOFFEE',  N'Potongan Non-Kopi Rp 8.000',  N'Potongan Rp 8.000 untuk minuman non-kopi: matcha, cokelat, dan teh.',             N'FixedAmount', 8000.00,  30000.00, NULL,      N'HEMAT 8RB',  1, 0, DATEADD(MONTH, 3, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'RASAMALAM',   N'Promo Nongkrong Malam 12%',   N'Diskon 12% untuk transaksi setelah pukul 19.00 WIB di seluruh area ruang rasa.',  N'Percentage',  12.00,  40000.00, 20000.00, N'MALAM 12%',  1, 0, DATEADD(MONTH, 3, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'KOPIGANDENG', N'Beli 2 Kopi Diskon 25%',      N'Diskon 25% khusus pembelian dua gelas kopi signature dalam satu transaksi.',      N'Percentage',  25.00,  60000.00, 25000.00, N'GANDENG 25%',1, 0, DATEADD(MONTH, 2, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'MAHASISWA',   N'Diskon Mahasiswa 20%',        N'Khusus pelajar & mahasiswa dengan menunjukkan kartu pelajar saat checkout.',      N'Percentage',  20.00,  25000.00, 15000.00, N'MABA 20%',   1, 0, DATEADD(MONTH, 6, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'WEEKEND10',   N'Weekend Hemat 10%',           N'Diskon 10% untuk semua transaksi Sabtu & Minggu sepanjang hari operasional.',     N'Percentage',  10.00,  30000.00, 10000.00, N'WKND 10%',   1, 0, DATEADD(MONTH, 2, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'BRUNCH25',    N'Promo Brunch Rp 25.000',      N'Potongan Rp 25.000 untuk paket brunch: kopi utama plus satu sajian pastry.',      N'FixedAmount', 25000.00, 75000.00, NULL,      N'BRUNCH 25RB',1, 0, DATEADD(MONTH, 4, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'KOPILOVER',   N'Voucher Kopi Loyal Rp 15.000',N'Potongan Rp 15.000 bagi pemegang voucher member setiap awal bulan.',              N'FixedAmount', 15000.00, 50000.00, NULL,      N'LOVER 15RB', 1, 0, DATEADD(MONTH, 5, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'COLDTHRILL',  N'Promo Minuman Dingin 18%',    N'Diskon 18% untuk semua varian cold brew, iced latte, dan es kopi susu.',          N'Percentage',  18.00,  30000.00, 20000.00, N'DINGIN 18%', 1, 0, DATEADD(MONTH, 3, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'RAPATTIM',    N'Paket Rapat Tim 30%',         N'Diskon 30% untuk pemesanan minimal 5 menu makanan dalam satu transaksi.',         N'Percentage',  30.00, 150000.00, 50000.00, N'TIM 30%',    1, 0, DATEADD(MONTH, 2, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'ULANGTAHUN',  N'Voucher Ulang Tahun Rp 30.000',N'Potongan Rp 30.000 khusus pada bulan ulang tahun member tercinta.',              N'FixedAmount', 30000.00, 60000.00, NULL,      N'ULTAH 30RB', 1, 0, DATEADD(MONTH, 6, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'GOSHIP',      N'Gratis Ongkir Area Bandung',  N'Bebas biaya pengantaran untuk pesanan delivery ke seluruh area Kota Bandung.',    N'FixedAmount', 10000.00, 40000.00, NULL,      N'FREE ONGKIR',1, 0, DATEADD(MONTH, 1, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'KOPIHITAM',   N'Promo Black Coffee 8%',       N'Diskon 8% untuk espresso, americano, dan manual brew pilihan barista.',           N'Percentage',   8.00,  20000.00,  8000.00, N'HITAM 8%',   1, 0, DATEADD(MONTH, 3, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'SNACKHEMAT',  N'Potongan Snack Rp 5.000',     N'Potongan Rp 5.000 untuk semua menu snack ringan pendamping kopi.',                N'FixedAmount', 5000.00,  20000.00, NULL,      N'HEMAT 5RB',  1, 0, DATEADD(MONTH, 3, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'EARLYBIRD',   N'Early Bird 20% (07-09)',      N'Diskon 20% untuk transaksi sebelum pukul 09.00 WIB — para pejuang pagi!',         N'Percentage',  20.00,  25000.00, 12000.00, N'PAGI 20%',   1, 0, DATEADD(MONTH, 2, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'DBLPROMO',    N'Bundling Kopi + Roti 22%',    N'Diskon 22% untuk pembelian satu minuman dan satu roti lembut dalam satu nota.',   N'Percentage',  22.00,  35000.00, 18000.00, N'BUNDEL 22%', 1, 0, DATEADD(MONTH, 3, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'KOPIKITA',    N'Promo Komunitas 25%',         N'Diskon 25% untuk komunitas, kelas, dan pertemuan book club (min. 4 orang).',      N'Percentage',  25.00, 100000.00, 40000.00, N'KOMUNITAS',  1, 0, DATEADD(MONTH, 4, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'PAYDAY',      N'Payday Sale 17%',             N'Diskon 17% selama tanggal 25-31 setiap bulannya. Rayakan gajian dengan kopi!',    N'Percentage',  17.00,  30000.00, 15000.00, N'GAJIAN 17%', 1, 0, DATEADD(MONTH, 2, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'VIPRASA',     N'Voucher VIP Rp 50.000',       N'Potongan Rp 50.000 khusus undangan pelanggan setia pilihan Ruang Rasa.',          N'FixedAmount', 50000.00,100000.00, NULL,     N'VIP 50RB',   1, 0, DATEADD(MONTH, 5, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'PROMOLAMA',   N'Promo Kadaluarsa (Nonaktif)', N'Contoh voucher nonaktif untuk pengujian filter status promo.',                    N'Percentage',  10.00,  20000.00,  5000.00, N'NONAKTIF',   0, 0, DATEADD(MONTH, -1, SYSUTCDATETIME()), SYSUTCDATETIME()),
    (N'PROMOHIAPUS', N'Promo Terhapus (Soft Delete)',N'Contoh promo terhapus lembut untuk pengujian soft delete & restore.',             N'FixedAmount', 7000.00,  25000.00, NULL,      N'DIHAPUS',    0, 1, DATEADD(MONTH, -2, SYSUTCDATETIME()), SYSUTCDATETIME());

    PRINT 'Seed data Promos tambahan (22 voucher) berhasil ditambahkan. Total promo kini >= 20 baris.';
END
GO

PRINT '====================================================================';
GO

