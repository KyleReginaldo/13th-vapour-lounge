"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useState } from "react";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split("T")[0];

  const handleSubmit = () => {
    // Handle form submission logic here

    console.log(`First Name: ${firstName}`);
    console.log(`Last Name: ${lastName}`);
    console.log(`Middle Name: ${middleName}`);
    console.log(`Suffix: ${suffix}`);
    console.log(`Contact Number: ${contactNumber}`);
    console.log(`Date of Birth: ${dateOfBirth}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Confirm Password: ${confirmPassword}`);
  };

  return (
    <div className="bg-white shadow-2xl p-8 rounded flex flex-col max-w-150 mx-auto mt-10 gap-4">
      <h4>Create an Account</h4>
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Label htmlFor="firstName" className="mb-1">
            First Name<span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="Enter first name"
            required
            value={firstName}
            className="mb-4"
            onChange={(e) => {
              setFirstName(e.target.value);
            }}
          />
          <Label htmlFor="lastName" className="mb-1">
            Last Name<span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Enter last name"
            required
            className="mb-4"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
            }}
          />
          <Label htmlFor="middleName" className="mb-1">
            Middle Name
          </Label>
          <Input
            id="middleName"
            placeholder="Enter middle name"
            className="mb-4"
            value={middleName}
            onChange={(e) => {
              setMiddleName(e.target.value);
            }}
          />
          <Label htmlFor="suffix" className="mb-1">
            Suffix
          </Label>
          <Input
            id="suffix"
            placeholder="Enter suffix"
            className="mb-4"
            value={suffix}
            onChange={(e) => {
              setSuffix(e.target.value);
            }}
          />
          <Label htmlFor="contactNumber" className="mb-1">
            Contact Number<span className="text-red-500">*</span>
          </Label>
          <Input
            id="contactNumber"
            placeholder="Enter contact number"
            required
            maxLength={11}
            className="mb-4"
            value={contactNumber}
            onChange={(e) => {
              setContactNumber(e.target.value);
            }}
          />
          <Label htmlFor="dateOfBirth" className="mb-1">
            Date of Birth<span className="text-red-500">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            placeholder="Enter date of birth"
            type="date"
            required
            max={maxDateString}
            className="mb-4"
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
            }}
          />
          <Label htmlFor="email" className="mb-1">
            Email<span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            placeholder="Enter email"
            required
            className="mb-4"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
          <Label htmlFor="password" className="mb-1">
            Password<span className="text-red-500">*</span>
          </Label>
          <PasswordInput
            id="password"
            placeholder="Enter password"
            required
            className="mb-4"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          <Label htmlFor="confirmPassword" className="mb-1">
            Confirm Password<span className="text-red-500">*</span>
          </Label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Enter confirm password"
            required
            className="mb-4"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
            }}
          />
          <Button className="w-full" type="submit">
            Sign Up
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
