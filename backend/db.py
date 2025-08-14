from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from databases import Database
import os
from dotenv import load_dotenv
from models import Base

# Load variables from .env into environment
load_dotenv()

# Get PostgreSQL configuration from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Please check your .env file.")

# Create async engine with proper pgbouncer compatibility
# Remove query parameters from URL and set them in connect_args
base_url = DATABASE_URL.split('?')[0]

engine = create_async_engine(
    base_url,
    echo=False,
    connect_args={
        "prepared_statement_cache_size": 0,  # Disable prepared statement cache for PgBouncer
        "statement_cache_size": 0,           # Disable statement cache
        "server_settings": {
            "application_name": "ambassador_platform",
        }
    },
    execution_options={
        "compiled_cache": {},  # Disable compiled cache
    },
    pool_pre_ping=True,
    pool_recycle=300,  # Recycle connections every 5 minutes
    pool_size=5,       # Limit connection pool size
    max_overflow=10,   # Maximum overflow connections
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Database instance for direct queries
database = Database(DATABASE_URL)

async def init_db():
    """Initialize PostgreSQL database and create tables"""
    try:
        # Connect to database
        await database.connect()
        print(f"Successfully connected to PostgreSQL at {DATABASE_URL}")
        
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("Database initialization completed successfully!")
        return True
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        return False

async def get_db():
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def init_db_sync():
    """Synchronous wrapper for init_db"""
    import asyncio
    return asyncio.run(init_db())
