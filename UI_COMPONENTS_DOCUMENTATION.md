# 🎨 TechBlit UI Component Library

A comprehensive set of reusable UI components built with React, TypeScript, and Tailwind CSS.

## 📦 **Installation**

The components are already installed and ready to use. They include:

- **clsx** - For conditional class names
- **tailwind-merge** - For merging Tailwind classes
- **@heroicons/react** - For consistent icons

## 🚀 **Quick Start**

```tsx
import { Button, Input, Card, CardContent } from '@/components/ui';

function MyComponent() {
  return (
    <Card>
      <CardContent>
        <Input label="Email" placeholder="Enter your email" />
        <Button variant="primary">Submit</Button>
      </CardContent>
    </Card>
  );
}
```

## 📋 **Available Components**

### **Form Components**

#### **Button**
```tsx
<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean

#### **Input**
```tsx
<Input
  label="Email"
  placeholder="Enter your email"
  error="Invalid email"
  helperText="We'll never share your email"
  leftIcon={<MailIcon />}
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: React.ReactNode
- `rightIcon`: React.ReactNode

#### **Textarea**
```tsx
<Textarea
  label="Message"
  placeholder="Enter your message"
  rows={4}
/>
```

#### **Dropdown** (Recommended)
```tsx
<Dropdown
  label="Country"
  options={[
    { value: 'us', label: 'United States', description: 'North America' },
    { value: 'ca', label: 'Canada', description: 'North America' },
    { value: 'uk', label: 'United Kingdom', icon: <FlagIcon /> }
  ]}
  placeholder="Select a country"
  searchable={true}
  clearable={true}
  variant="default"
  size="md"
/>
```

**Props:**
- `options`: Array of DropdownOption objects
- `searchable`: Enable search functionality
- `clearable`: Show clear button
- `variant`: 'default' | 'filled' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `leftIcon`: Icon on the left side
- `rightIcon`: Custom icon on the right side

#### **Select** (Legacy)
```tsx
<Select
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' }
  ]}
  placeholder="Select a country"
/>
```

#### **Checkbox**
```tsx
<Checkbox
  label="I agree to the terms"
  helperText="Please read our terms and conditions"
/>
```

### **Layout Components**

#### **Card**
```tsx
<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### **PageHeader**
```tsx
<PageHeader
  title="Dashboard"
  description="Welcome to your dashboard"
  action={<Button>Add New</Button>}
/>
```

### **Data Display Components**

#### **Badge**
```tsx
<Badge variant="success" size="md">
  Active
</Badge>
```

**Variants:** 'default' | 'success' | 'warning' | 'danger' | 'info'

#### **StatsCard**
```tsx
<StatsCard
  title="Total Users"
  value="1,234"
  icon={<UsersIcon />}
  trend={{ value: "+12%", isPositive: true }}
/>
```

#### **DataTable**
```tsx
<DataTable>
  <DataTableRow>
    <div>Row content</div>
  </DataTableRow>
</DataTable>
```

#### **EmptyState**
```tsx
<EmptyState
  icon={<DocumentIcon />}
  title="No posts found"
  description="Get started by creating your first post"
  action={<Button>Create Post</Button>}
/>
```

### **Feedback Components**

#### **Alert**
```tsx
<Alert variant="success">
  Your changes have been saved!
</Alert>
```

**Variants:** 'info' | 'success' | 'warning' | 'danger'

#### **Spinner**
```tsx
<Spinner size="md" />
```

#### **Modal**
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  <p>Are you sure you want to delete this item?</p>
  <div className="flex justify-end space-x-2 mt-4">
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="danger">Delete</Button>
  </div>
</Modal>
```

### **Navigation Components**

#### **Tabs**
```tsx
<Tabs
  tabs={[
    { id: 'tab1', label: 'Overview', content: <div>Tab 1 content</div> },
    { id: 'tab2', label: 'Settings', content: <div>Tab 2 content</div> }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

#### **Breadcrumb**
```tsx
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Admin', href: '/admin' },
    { label: 'Users' }
  ]}
/>
```

### **Advanced Components**

#### **SearchInput**
```tsx
<SearchInput
  placeholder="Search users..."
  onClear={() => setSearchTerm('')}
/>
```

#### **FormGroup & FormRow**
```tsx
<FormGroup>
  <FormRow>
    <Input label="First Name" />
    <Input label="Last Name" />
  </FormRow>
  <Input label="Email" />
</FormGroup>
```

## 🎨 **Styling & Customization**

### **Using the `cn` utility**
```tsx
import { cn } from '@/lib/utils';

<Button className={cn('w-full', isActive && 'bg-green-600')}>
  Custom Button
</Button>
```

### **Custom Variants**
You can extend components with custom styles:

```tsx
<Button className="bg-purple-600 hover:bg-purple-700">
  Custom Purple Button
</Button>
```

## 📱 **Responsive Design**

All components are built with mobile-first responsive design:

```tsx
<FormRow className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  <Input label="Field 1" />
  <Input label="Field 2" />
  <Input label="Field 3" />
</FormRow>
```

## ♿ **Accessibility**

Components include proper accessibility features:
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility

## 🔧 **TypeScript Support**

All components are fully typed with TypeScript:

```tsx
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return <Button onClick={onAction}>{title}</Button>;
};
```

## 📚 **Examples**

### **Complete Form Example**
```tsx
import { 
  Card, 
  CardContent, 
  CardHeader, 
  FormGroup, 
  FormRow, 
  Input, 
  Textarea, 
  Select, 
  Checkbox, 
  Button 
} from '@/components/ui';

function ContactForm() {
  return (
    <Card>
      <CardHeader>
        <h2>Contact Us</h2>
      </CardHeader>
      <CardContent>
        <FormGroup>
          <FormRow>
            <Input label="First Name" required />
            <Input label="Last Name" required />
          </FormRow>
          <Input label="Email" type="email" required />
          <Select
            label="Subject"
            options={[
              { value: 'general', label: 'General Inquiry' },
              { value: 'support', label: 'Support' },
              { value: 'sales', label: 'Sales' }
            ]}
          />
          <Textarea label="Message" rows={4} required />
          <Checkbox label="I agree to receive updates" />
          <Button type="submit" className="w-full">
            Send Message
          </Button>
        </FormGroup>
      </CardContent>
    </Card>
  );
}
```

### **Dashboard Example**
```tsx
import { 
  PageHeader, 
  StatsCard, 
  DataTable, 
  DataTableRow, 
  EmptyState,
  Button,
  Badge
} from '@/components/ui';

function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your account"
        action={<Button>Add New</Button>}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Users"
          value="1,234"
          trend={{ value: "+12%", isPositive: true }}
        />
        <StatsCard
          title="Revenue"
          value="$12,345"
          trend={{ value: "+8%", isPositive: true }}
        />
        <StatsCard
          title="Orders"
          value="567"
          trend={{ value: "-2%", isPositive: false }}
        />
      </div>

      <DataTable>
        <DataTableRow>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">John Doe</h3>
              <p className="text-sm text-gray-500">john@example.com</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </DataTableRow>
      </DataTable>
    </div>
  );
}
```

## 🚀 **Best Practices**

1. **Consistent Spacing**: Use the built-in spacing utilities
2. **Accessibility First**: Always include proper labels and ARIA attributes
3. **Mobile Responsive**: Test on different screen sizes
4. **Type Safety**: Use TypeScript for better development experience
5. **Performance**: Use React.forwardRef for better performance

## 🔄 **Migration Guide**

If you're updating existing components to use the new UI library:

1. **Replace custom buttons** with the `Button` component
2. **Replace form inputs** with `Input`, `Textarea`, `Select` components
3. **Replace custom cards** with `Card`, `CardHeader`, `CardContent` components
4. **Use `PageHeader`** for consistent page headers
5. **Replace custom alerts** with the `Alert` component

This UI library provides a solid foundation for building consistent, accessible, and maintainable user interfaces across your entire application! 🎉
