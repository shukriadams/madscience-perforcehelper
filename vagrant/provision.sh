sudo apt-get update

sudo apt-get install git -y
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install nodejs -y

curl -sL https://cdist2.perforce.com/perforce/r20.1/bin.linux26x86_64/p4 --output /tmp/p4 
sudo cp /tmp/p4  /usr/local/bin/ 
sudo chmod +x /usr/local/bin/p4 

# force startup folder to vagrant project
echo "cd /vagrant" >> /home/vagrant/.bashrc

# set hostname, makes console easier to identify
sudo echo "p4helper" > /etc/hostname
sudo echo "127.0.0.1 p4helper" >> /etc/hosts
