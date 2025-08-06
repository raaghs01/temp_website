import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const ShadCNDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ShadCN Components Demo</h1>
        <p className="text-gray-600">Examples of ShadCN components in action</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Button Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Different button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="destructive">Destructive Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
            </div>
            <div className="space-y-2">
              <Button size="sm">Small Button</Button>
              <Button size="default">Default Size</Button>
              <Button size="lg">Large Button</Button>
            </div>
          </CardContent>
        </Card>

        {/* Input Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Form input components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input placeholder="Default input" />
              <Input type="email" placeholder="Email input" />
              <Input type="password" placeholder="Password input" />
              <Input disabled placeholder="Disabled input" />
            </div>
          </CardContent>
        </Card>

        {/* Card Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Cards</CardTitle>
            <CardDescription>Card component with different sections</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              This is an example of a card with header, content, and footer sections.
              Cards are great for organizing content into distinct sections.
            </p>
          </CardContent>
          <CardFooter>
            <Button>Action Button</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Form Example */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Contact Form</CardTitle>
          <CardDescription>Example form using ShadCN components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="Enter your name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="Enter your email" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea 
              className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your message"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Submit</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ShadCNDemo; 