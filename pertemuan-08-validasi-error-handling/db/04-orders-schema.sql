-- ============================================================
-- Pertemuan 08 - Hands-on 2
-- Migrasi aditif untuk fitur checkout customer.
--
-- Jalankan setelah 01-menu-schema.sql dan schema Pertemuan 03.
-- Script ini idempoten: aman dijalankan lebih dari sekali.
-- ============================================================

USE review_kantin;
GO

IF OBJECT_ID('dbo.USERS', 'U') IS NULL
   OR OBJECT_ID('dbo.MENU_ITEMS', 'U') IS NULL
BEGIN
    THROW 50001, 'Tabel USERS/MENU_ITEMS belum ada. Jalankan schema Pertemuan 03 terlebih dahulu.', 1;
END
GO

-- ---------------------------------------------------------------- ORDERS
IF OBJECT_ID('dbo.ORDERS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ORDERS (
        id             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ORDERS PRIMARY KEY,
        order_code     NVARCHAR(30) NOT NULL CONSTRAINT UQ_ORDERS_order_code UNIQUE,
        customer_id    INT NOT NULL,
        customer_name  NVARCHAR(80) NOT NULL,
        phone          NVARCHAR(20) NOT NULL,
        payment_method NVARCHAR(20) NOT NULL
            CONSTRAINT CK_ORDERS_payment_method
            CHECK (payment_method IN (N'cash', N'qris', N'transfer')),
        note           NVARCHAR(200) NULL,
        total          INT NOT NULL CONSTRAINT CK_ORDERS_total CHECK (total > 0),
        status         NVARCHAR(20) NOT NULL
            CONSTRAINT DF_ORDERS_status DEFAULT (N'confirmed')
            CONSTRAINT CK_ORDERS_status
            CHECK (status IN (N'confirmed', N'completed', N'cancelled')),
        created_at     DATETIME2(0) NOT NULL
            CONSTRAINT DF_ORDERS_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_ORDERS_USERS FOREIGN KEY (customer_id)
            REFERENCES dbo.USERS (id)
    );

    PRINT 'Tabel ORDERS dibuat.';
END
ELSE
BEGIN
    PRINT 'Tabel ORDERS sudah ada.';
END
GO

-- ----------------------------------------------------------- ORDER_ITEMS
IF OBJECT_ID('dbo.ORDER_ITEMS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ORDER_ITEMS (
        id         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ORDER_ITEMS PRIMARY KEY,
        order_id   INT NOT NULL,
        menu_id    INT NULL,
        stall_id   INT NULL,
        stall_name NVARCHAR(100) NULL,
        menu_name  NVARCHAR(100) NOT NULL,
        unit_price INT NOT NULL CONSTRAINT CK_ORDER_ITEMS_unit_price CHECK (unit_price > 0),
        quantity   INT NOT NULL CONSTRAINT CK_ORDER_ITEMS_quantity CHECK (quantity BETWEEN 1 AND 20),
        subtotal   INT NOT NULL CONSTRAINT CK_ORDER_ITEMS_subtotal CHECK (subtotal > 0),
        CONSTRAINT UQ_ORDER_ITEMS_order_menu UNIQUE (order_id, menu_id),
        CONSTRAINT FK_ORDER_ITEMS_ORDERS FOREIGN KEY (order_id)
            REFERENCES dbo.ORDERS (id) ON DELETE CASCADE,
        -- Snapshot nama/harga tetap tersimpan walau menu aslinya dihapus.
        CONSTRAINT FK_ORDER_ITEMS_MENU FOREIGN KEY (menu_id)
            REFERENCES dbo.MENU_ITEMS (id) ON DELETE SET NULL
    );

    PRINT 'Tabel ORDER_ITEMS dibuat.';
END
ELSE
BEGIN
    PRINT 'Tabel ORDER_ITEMS sudah ada.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ORDERS_customer_id'
      AND object_id = OBJECT_ID(N'dbo.ORDERS')
)
BEGIN
    CREATE INDEX IX_ORDERS_customer_id ON dbo.ORDERS (customer_id, id DESC);
    PRINT 'Index IX_ORDERS_customer_id dibuat.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ORDER_ITEMS_order_id'
      AND object_id = OBJECT_ID(N'dbo.ORDER_ITEMS')
)
BEGIN
    CREATE INDEX IX_ORDER_ITEMS_order_id ON dbo.ORDER_ITEMS (order_id);
    PRINT 'Index IX_ORDER_ITEMS_order_id dibuat.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ORDER_ITEMS_stall_id'
      AND object_id = OBJECT_ID(N'dbo.ORDER_ITEMS')
)
BEGIN
    CREATE INDEX IX_ORDER_ITEMS_stall_id ON dbo.ORDER_ITEMS (stall_id);
    PRINT 'Index IX_ORDER_ITEMS_stall_id dibuat.';
END
GO

PRINT 'Schema Pertemuan 08 Hands-on 2 selesai.';
GO
