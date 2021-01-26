sudo apt-get update

sudo apt-get install git -y
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install nodejs -y

# force startup folder to vagrant project
echo "cd /vagrant" >> /home/vagrant/.bashrc

# set hostname, makes console easier to identify
sudo echo "p4helper" > /etc/hostname
sudo echo "127.0.0.1 p4helper" >> /etc/hosts
