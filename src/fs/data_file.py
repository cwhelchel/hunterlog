# thanks claude you dumb clanker

from datetime import datetime
import os
from pathlib import Path
import sys
from typing import Optional, List


class DataFile:
    '''
    Abstracts Hunterlog data file objects with only a file name. The files are
    located in the data directory.

    Attributes:
        name (str): The name of the file
    '''

    data_root = "data/"

    def __init__(self, name: str):
        '''
        Initialize a file system object.

        Args:
            name: Name of the file. Can have prepended partial path that will
            be created in data_root location
        '''
        self.name = name
        self.app_root = DataFile.get_app_root()
        self.root = Path(self.app_root, self.data_root).resolve()

    @property
    def full_path(self) -> str:
        '''Returns the complete path to the file system object.'''
        return os.path.join(self.root, self.name)

    @property
    def exists(self) -> bool:
        '''Check if the file system object exists.'''
        return os.path.exists(self.full_path)

    @property
    def is_file(self) -> bool:
        '''Check if the object is a file.'''
        return os.path.isfile(self.full_path)

    @property
    def is_directory(self) -> bool:
        '''Check if the object is a directory.'''
        return os.path.isdir(self.full_path)

    @property
    def size(self) -> Optional[int]:
        '''Get the size of the file in bytes (or None).'''
        if self.is_file:
            return os.path.getsize(self.full_path)
        return None

    @property
    def extension(self) -> str:
        '''Get the file extension (empty string if none).'''
        return os.path.splitext(self.name)[1]

    @property
    def modified_date(self) -> Optional[datetime]:
        '''Get the last file modification date'''
        if self.is_file and self.exists:
            return datetime.fromtimestamp(os.path.getmtime(self.full_path))
        return None

    def create(self, content: str = "") -> bool:
        '''
        Create the file with optional content.

        Args:
            content: Initial content for the file

        Returns:
            True if created successfully, False otherwise
        '''
        try:
            full_path = Path(self.full_path)
            temp_dirs = full_path.parent
            os.makedirs(temp_dirs, exist_ok=True)
            with open(self.full_path, 'w') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error creating file: {e}")
            return False

    def read(self) -> Optional[str]:
        '''
        Read file contents.

        Returns:
            File contents as string, or None if not a file or error occurs
        '''
        if not self.is_file:
            return None
        try:
            with open(self.full_path, 'r') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading file: {e}")
            return None

    def write(self, content: str) -> bool:
        '''
        Write content to the file.

        Args:
            content: Content to write

        Returns:
            True if successful, False otherwise
        '''
        try:
            with open(self.full_path, 'w') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error writing to file: {e}")
            return False

    def append(self, content: str) -> bool:
        '''
        Append content to the file.

        Args:
            content: Content to append

        Returns:
            True if successful, False otherwise
        '''
        try:
            with open(self.full_path, 'a') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error appending to file: {e}")
            return False

    def delete(self) -> bool:
        '''
        Delete the file or directory.

        Returns:
            True if deleted successfully, False otherwise
        '''
        try:
            if self.is_file:
                os.remove(self.full_path)
            elif self.is_directory:
                os.rmdir(self.full_path)
            return True
        except Exception as e:
            print(f"Error deleting: {e}")
            return False

    def list_contents(self) -> Optional[List[str]]:
        '''
        List contents of directory.

        Returns:
            List of names in directory, or None if not a directory
        '''
        if not self.is_directory:
            return None
        try:
            return os.listdir(self.full_path)
        except Exception as e:
            print(f"Error listing directory: {e}")
            return None

    @staticmethod
    def get_app_root() -> str:
        '''stolen from alembic/versions/__init__.py'''
        if getattr(sys, 'frozen', False):
            return os.path.abspath(os.path.dirname(sys.executable))
        elif __file__:
            # were running from source (npm run start) and this file is in a
            # sub-dir so we need to back up a little so the code works
            return os.path.dirname(__file__) + "/../../"

    def __str__(self) -> str:
        '''String representation of the object.'''
        if self.is_file:
            type = "file"
        elif self.is_directory:
            type = "directory"
        else:
            type = "non-existent"
        return f"<datafile(name='{self.name}',fullpath='{self.full_path}', type={type})>" # NOQA

    def __repr__(self) -> str:
        '''Developer-friendly representation.'''
        return f"<datafile(name='{self.name}', fullpath='{self.full_path}')>"
