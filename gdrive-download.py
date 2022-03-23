import os
import io
import sys
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive

DL_DIR = "++DATA/"
DRIVE_ROOT = "1Cj_5LEeQ7b-8aPGUyoqCQkwDxqzLcVgm"

def main():
    gauth = GoogleAuth()
    gauth.LocalWebserverAuth()
    drive = GoogleDrive(gauth)


    def create_file_list(id):
      folder_id = id
      query = f"parents = '{folder_id}'"
      file_list = drive.ListFile({
          'q': query
      }).GetList()
      return file_list


    def clearDir(directory):
      for file_name in os.listdir(directory):
          # construct full file DL_DIR
          file = directory + file_name
          print(file_name)
          if os.path.isfile(file) and file_name != ".gitignore":
              print('Deleting file:', file)
              os.remove(file)

    root_folder = create_file_list(DRIVE_ROOT)

    if len(sys.argv) > 1: sys_arg = sys.argv[1]
    else: sys_arg = "none"
    if sys_arg == "force": clearDir(DL_DIR)
    def fileLoop(files):
        for file in files:
          fileName = file['title']
          if file['mimeType'] == 'application/vnd.google-apps.folder':
            current_folder = create_file_list(f"{file['id']}")
            fileLoop(current_folder)
          elif file['mimeType'] == 'application/vnd.google-apps.document':
            fileExists = os.path.exists(f'{DL_DIR}/{fileName}.txt')
            if fileExists is True and sys_arg == "force": 
              file.GetContentFile(f"{DL_DIR}/{fileName}.txt")
              print(f"file: {file['title']}, id: {file['id']} overwritten. ")

            if fileExists is False:
              file.GetContentFile(f"{DL_DIR}/{fileName}.txt")
              print(f"file: {file['title']}, id: {file['id']} downloaded. ")
            
           #  os.replace(file['title'], f"{DL_DIR}/{fileName}.txt")

    fileLoop(root_folder)

    # for file in root_folder:
    #     print(f"title: {file['title']}, id: {file['id']}")
    #     fileName = file['title']
    #     if file['mimeType'] == 'application/vnd.google-apps.folder':
    #       print("folder")
    #     elif file['mimeType'] == 'application/vnd.google-apps.document':
    #       file.GetContentFile(fileName)
    #       os.replace(file['title'], f"randomDownload/{fileName}.txt")


if __name__ == '__main__':
    main()
