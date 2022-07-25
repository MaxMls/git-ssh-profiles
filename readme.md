```sh
# install
npm i -g pm2


# windows steps
npm install pm2-windows-startup -g

## admin sudo
Set-ExecutionPolicy RemoteSigned

pm2-startup install


# linux steps
pm2 startup

#
pm2 start .
pm2 save
```
