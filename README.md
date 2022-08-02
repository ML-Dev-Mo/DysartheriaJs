# DysartheriaJs
Command recognition JS project. It can be used for a people with some speech difficulties, like dysartheria. 
It will map the user voice to some pre-defined commands and train the with user's voice.
The project can be used in react and react_native.

When the project has started the user can define as many commands as he wants and then the program get some sample speechs from user. 
After examples collected successfuly the training will be started and after about 5-10 seconds the model will be created.
This model can be saved in the browser or also can be sent to server's api for future use.

The project used some packages to get the user voice and digitize it with some fourier transorfamation which is not may be available in react_native.
This work has been done by using TF.js
