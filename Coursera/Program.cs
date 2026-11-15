using System;
using System.Collections.Generic;

class Program
{
    // List to store products
    static List<Product> products = new List<Product>();

    static void Main()
    {
        // Simple menu loop
        bool exit = false;
        while (!exit)
        {
            Console.WriteLine("Inventory Management System");
            Console.WriteLine("1. Add Product");
            Console.WriteLine("2. Update Stock");
            Console.WriteLine("3. View Products");
            Console.WriteLine("4. Remove Product");
            Console.WriteLine("5. Exit");
            Console.Write("Choose an option: ");

            string input = Console.ReadLine();

            switch (input)
            {
                case "1":
                    AddProduct();
                    break;
                case "2":
                    UpdateStock();
                    break;
                case "3":
                    DisplayProducts();
                    break;
                case "4":
                    RemoveProduct();
                    break;
                case "5":
                    exit = true;
                    break;
                default:
                    Console.WriteLine("Invalid option. Try again.");
                    break;
            }
        }
        Console.WriteLine("Exiting program.");
    }

    static void AddProduct()
    {
        Console.Write("Enter product name: ");
        string name = Console.ReadLine();

        Console.Write("Enter product price: ");
        decimal price = decimal.Parse(Console.ReadLine());

        Console.Write("Enter stock quantity: ");
        int stock = int.Parse(Console.ReadLine());

        products.Add(new Product { Name = name, Price = price, Stock = stock });

        Console.WriteLine("Product added successfully.\n");
    }

    static void UpdateStock()
    {
        Console.Write("Enter product name to update stock: ");
        string name = Console.ReadLine();

        Product product = products.Find(p => p.Name == name);

        if (product != null)
        {
            Console.Write("Enter new stock quantity: ");
            int stock = int.Parse(Console.ReadLine());
            product.Stock = stock;
            Console.WriteLine("Stock updated successfully.\n");
        }
        else
        {
            Console.WriteLine("Product not found.\n");
        }
    }

    static void DisplayProducts()
    {
        if (products.Count == 0)
        {
            Console.WriteLine("No products in inventory.\n");
            return;
        }

        Console.WriteLine("Current Inventory:");
        foreach (var product in products)
        {
            Console.WriteLine($"Name: {product.Name}, Price: ${product.Price}, Stock: {product.Stock}");
        }
        Console.WriteLine();
    }

    static void RemoveProduct()
    {
        Console.Write("Enter product name to remove: ");
        string name = Console.ReadLine();

        Product product = products.Find(p => p.Name == name);

        if (product != null)
        {
            products.Remove(product);
            Console.WriteLine("Product removed successfully.\n");
        }
        else
        {
            Console.WriteLine("Product not found.\n");
        }
    }
}

class Product
{
    public string Name;
    public decimal Price;
    public int Stock;
}
