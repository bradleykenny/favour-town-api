curl --data "f_name=demo&l_name=man&username=demoman72&password=PasswordTest&email=demoman@blu.org" localhost:5000/register
pause
cls
curl -c cookieFile --data "username=test&password=PasswordTest" localhost:5000/login
pause
cls
curl -b cookieFile --data "" localhost:5000/hassession
pause
cls
curl -b cookieFile --data "title=test&location=test&description=test&favour_coins=350" localhost:5000/favours
pause
cls
start http:/localhost:5000/favours?count=100
pause
cls