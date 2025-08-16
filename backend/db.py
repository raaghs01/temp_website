from sqlalchemy import create_engine, text
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
        # Connect to database with timeout
        import asyncio
        await asyncio.wait_for(database.connect(), timeout=30.0)
        print(f"Successfully connected to PostgreSQL at {DATABASE_URL}")

        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

            # Check if last_submission_date column exists and add it if missing
            await conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'users' AND column_name = 'last_submission_date'
                    ) THEN
                        ALTER TABLE users ADD COLUMN last_submission_date TIMESTAMP;
                        CREATE INDEX IF NOT EXISTS ix_users_last_submission_date ON users(last_submission_date);
                    END IF;
                END $$;
            """))

            # Check if file_type column exists in submission_files and add it if missing
            await conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'submission_files' AND column_name = 'file_type'
                    ) THEN
                        ALTER TABLE submission_files ADD COLUMN file_type VARCHAR;
                    END IF;
                END $$;
            """))

            # Fix UUID column types if they are currently VARCHAR - handle foreign keys carefully
            # Temporarily commented out to debug startup issues
            # await conn.execute(text("""
            #     DO $$
            #     BEGIN
            #         -- Drop foreign key constraints first
            #         IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'submissions_user_id_fkey') THEN
            #             ALTER TABLE submissions DROP CONSTRAINT submissions_user_id_fkey;
            #         END IF;
            #         IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'submissions_task_id_fkey') THEN
            #             ALTER TABLE submissions DROP CONSTRAINT submissions_task_id_fkey;
            #         END IF;
            #         IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'submission_files_submission_id_fkey') THEN
            #             ALTER TABLE submission_files DROP CONSTRAINT submission_files_submission_id_fkey;
            #         END IF;
            #         IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'analytics_user_id_fkey') THEN
            #             ALTER TABLE analytics DROP CONSTRAINT analytics_user_id_fkey;
            #         END IF;

            #         -- Fix users table ID column
            #         IF EXISTS (
            #             SELECT 1 FROM information_schema.columns
            #             WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'character varying'
            #         ) THEN
            #             ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::UUID;
            #         END IF;

            #         -- Fix tasks table ID column
            #         IF EXISTS (
            #             SELECT 1 FROM information_schema.columns
            #             WHERE table_name = 'tasks' AND column_name = 'id' AND data_type = 'character varying'
            #         ) THEN
            #             ALTER TABLE tasks ALTER COLUMN id TYPE UUID USING id::UUID;
            #         END IF;

            #         -- Fix submissions table columns
            #         IF EXISTS (
            #             SELECT 1 FROM information_schema.columns
            #             WHERE table_name = 'submissions' AND column_name = 'user_id' AND data_type = 'character varying'
            #         ) THEN
            #             ALTER TABLE submissions ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
            #         END IF;
            #         IF EXISTS (
            #             SELECT 1 FROM information_schema.columns
            #             WHERE table_name = 'submissions' AND column_name = 'task_id' AND data_type = 'character varying'
            #         ) THEN
            #             ALTER TABLE submissions ALTER COLUMN task_id TYPE UUID USING task_id::UUID;
            #         END IF;
            #         IF EXISTS (
            #             SELECT 1 FROM information_schema.columns
            #             WHERE table_name = 'submissions' AND column_name = 'id' AND data_type = 'character varying'
            #         ) THEN
            #             ALTER TABLE submissions ALTER COLUMN id TYPE UUID USING id::UUID;
            #         END IF;

            #         -- Fix submission_files table columns
            #         IF EXISTS (
            #             SELECT 1 FROM information_schema.columns
            #             WHERE table_name = 'submission_files' AND column_name = 'submission_id' AND data_type = 'character varying'
            #         ) THEN
            #             ALTER TABLE submission_files ALTER COLUMN submission_id TYPE UUID USING submission_id::UUID;
            #         END IF;
            #         IF EXISTS (
            #             SELECT 1 FROM information_schema.columns
            #             WHERE table_name = 'submission_files' AND column_name = 'id' AND data_type = 'character varying'
            #         ) THEN
            #             ALTER TABLE submission_files ALTER COLUMN id TYPE UUID USING id::UUID;
            #         END IF;

            #         -- Fix analytics table columns
            #         IF EXISTS (
            #             SELECT 1 FROM information_schema.columns
            #             WHERE table_name = 'analytics' AND column_name = 'user_id' AND data_type = 'character varying'
            #         ) THEN
            #             ALTER TABLE analytics ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
            #         END IF;
            #         IF EXISTS (
            #             SELECT 1 FROM information_schema.columns
            #             WHERE table_name = 'analytics' AND column_name = 'id' AND data_type = 'character varying'
            #         ) THEN
            #             ALTER TABLE analytics ALTER COLUMN id TYPE UUID USING id::UUID;
            #         END IF;

            #         -- Recreate foreign key constraints
            #         IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'submissions_user_id_fkey') THEN
            #             ALTER TABLE submissions ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
            #         END IF;
            #         IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'submissions_task_id_fkey') THEN
            #             ALTER TABLE submissions ADD CONSTRAINT submissions_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id);
            #         END IF;
            #         IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'submission_files_submission_id_fkey') THEN
            #             ALTER TABLE submission_files ADD CONSTRAINT submission_files_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id);
            #         END IF;
            #         IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'analytics_user_id_fkey') THEN
            #             ALTER TABLE analytics ADD CONSTRAINT analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
            #         END IF;
            #     END $$;
            # """))

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
