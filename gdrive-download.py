import os
import io
import sys
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive

DL_DIR = "++DATA/"
DRIVE_ROOT = "1Cj_5LEeQ7b-8aPGUyoqCQkwDxqzLcVgm"

class tColors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def main():
    gauth = GoogleAuth()
    gauth.LocalWebserverAuth()
    drive = GoogleDrive(gauth)


    def create_file_list(id):
      folderId = id
      query = f"parents = '{folderId}' and trashed = false"
      fileList = drive.ListFile({
          'q': query
      }).GetList()
      return fileList


    def clear_dir(directory):
      for fileName in os.listdir(directory):
          # construct full file DL_DIR
          file = directory + fileName
          if os.path.isfile(file) and fileName != ".gitignore":
              print(f"Deleting file: {tColors.WARNING + file + tColors.ENDC}")
              os.remove(file)

    rootFolder = create_file_list(DRIVE_ROOT)
    if len(sys.argv) > 1: sys_arg = sys.argv[1]
    else: sys_arg = "none"
    if sys_arg == "force": clear_dir(DL_DIR)


    def file_loop(files):  
        for file in files:
          fileName = file['title']
          if file['mimeType'] == 'application/vnd.google-apps.folder':
            current_folder = create_file_list(f"{file['id']}")
            file_loop(current_folder)
          elif file['mimeType'] == 'application/vnd.google-apps.document':
            fileExists = os.path.exists(f'{DL_DIR}/{fileName}.txt')
            if fileExists is True and sys_arg == "force": 
              file.GetContentFile(f"{DL_DIR}/{fileName}.txt")
              print(f"file: {tColors.OKGREEN}{file['title']}.txt{tColors.ENDC} overwritten. ")

            if fileExists is False:
              print(f"Downloading {tColors.OKGREEN}{file['title']}.txt{tColors.ENDC}")
              file.GetContentFile(f"{DL_DIR}/{fileName}.txt")
                   
           #  os.replace(file['title'], f"{DL_DIR}/{fileName}.txt")

    file_loop(rootFolder)
    print(f"Finished.")

if __name__ == '__main__':
    main()
