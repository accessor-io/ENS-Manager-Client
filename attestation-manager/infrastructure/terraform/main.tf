provider "aws" {
  region = "us-west-2"
}

resource "aws_instance" "attestation_service" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "AttestationServiceInstance"
  }
}

resource "aws_instance" "verification_service" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "VerificationServiceInstance"
  }
}

resource "aws_instance" "user_service" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "UserServiceInstance"
  }
}
