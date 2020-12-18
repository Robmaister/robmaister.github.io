---
layout: post
status: publish
published: true
comments: true
has-code: true
has-lightbox: true
title: Beyond DataAsset - Building Engine Quality Assets (Part 1)
date: '2020-12-15 00:00:00 -0700'
tags: [unreal, data-asset, c++]
preview-img:
    url: /img/blog/2015/10/20151023_113508.jpg
    alt: VR for G3
---

As an Unreal developer, one of the first tools you will reach for when building
out a new system is `UDataAsset`. If you are not familiar, `UDataAsset` is a
simple yet powerful class that takes care of all the boilerplate of setting up
a new asset type, allowing you to simply inherit from C++ or Blueprint and
start creating assets.

As your new system grows and becomes more complex, you may find yourself
wanting more control over how the asset is created and edited. There is a
patchwork of tutorials and blog posts online to help with different aspects of
this, but no single guide.

This set of posts will demystify the whole process and provide a complete
example asset that can be imported, exported, and edited with a 3d viewport.

# The Asset

We will be building out an asset type to add a "target practice" system to the
first person shooter sample project.

Specifically, this target practice system will present multiple timed waves of
targets to shoot. Each target can be customized visually. The DataAsset class
is defined like so:

<div class="code-caption">TargetPracticeRound.h</div>
{% highlight cpp linenos %}
USTRUCT(BlueprintType)
struct FTarget
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FTransform Transform;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FLinearColor Color = FLinearColor::Red;
};

USTRUCT(BlueprintType)
struct FTargetWave
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float Timeout = 15.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<FTarget> Targets;
};

UCLASS()
class UTargetPracticeRound : public UDataAsset
{
	GENERATED_BODY()

public:

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FText DisplayName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<FTargetWave> Waves;
};
{% endhighlight %}

As you can see this is technically editable, but asking a designer to make 50
of these assets means you either have a very patient designer or a death wish.

[![][1]][1]{: data-lightbox="img-1"}

This tends to be the case with any asset that involves 3d locations. It may be
tempting to use Blueprints and a lot of components to create a reasonable
editor experience, but this creates a number of issues down the road while
still not provide an amazing editor experience.

# Code Setup

Before we dive into converting `UTargetPracticeRound` into a custom asset type,
make sure you have a separate Editor module for your project. This will allow
us to organize code into two sections, code that is part of the game itself,
and code that is used to extend Unreal Editor.

Another way to think about this is to consider all code in the editor module as
auotmatically wrapped in a `WITH_EDITOR` check.

This section is largely based on the [Creating Custom Modules][2] tutorial by
Orfeas Eleftheriou. Epic Games has [their own explanation][3] of the pros and
cons of separate gameplay modules. Editor modules, however, are quite common
within the engine.

## New Module Folder

By default your project's Source folder will contain two `.Target.cs` files and
one folder with the same name as your project. Create a new folder with the
name of your project followed by "Editor". For example, the new editor module
folder name for `BeyondDataAsset` would be `BeyondDataAssetEditor`.

In this folder, create 3 new files with the same base name with the extensions
`.Build.cs`, `.h`, and `.cpp`.

[![][4]][4]{: data-lightbox="img-4"}

You can optionally create `Public` and `Private` folders here for the `.h` and
`.cpp` files respectively, for simplicity I have excluded them in this guide.
I personally think it is fine to omit these folders for the primary game module
and the primary editor module.

## Base Module Code

Navigate up to your project's `.uproject` file, right click it and select the
option to Generate Project Files. If you are running a copy of the engine from
source and haven't registered the engine version, you can also generate project
files from the command line.

Open up your IDE and you should see your editor folder and the 3 new files
under the Source folder in your game project. Open up the `.Build.cs` and add
contents similar to the following. Make sure to substitute your project's name
wherever `BeyondDataAsset` is used.

<div class="code-caption">BeyondDataAssetEditor.Build.cs</div>
{% highlight csharp linenos %}
using UnrealBuildTool;

public class BeyondDataAssetEditor : ModuleRules
{
	public BeyondDataAssetEditor(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[]
		{
			"BeyondDataAsset",

			"Core",
			"CoreUObject",
			"Engine",
		});
	}
}
{% endhighlight %}

The `.h` file should have contents similar to this. The log category is not
necessary but can be useful for debugging later on.

<div class="code-caption">BeyondDataAssetEditor.h</div>
{% highlight cpp linenos %}
#pragma once

#include "Modules/ModuleManager.h"

DECLARE_LOG_CATEGORY_EXTERN(BeyondDataAssetEditor, Log, All);

class FBeyondDataAssetEditorModule : public IModuleInterface
{
public:

	virtual void StartupModule() override;
	virtual void ShutdownModule() override;
};
{% endhighlight %}

The `.cpp` file is where we will be registering all of our editor classes. For
now the Startup/Shutdown functions are empty stubs.

<div class="code-caption">BeyondDataAssetEditor.cpp</div>
{% highlight cpp linenos %}
#include "BeyondDataAssetEditor.h"

DEFINE_LOG_CATEGORY(BeyondDataAssetEditor);

void FBeyondDataAssetEditorModule::StartupModule()
{

}

void FBeyondDataAssetEditorModule::ShutdownModule()
{

}

IMPLEMENT_MODULE(FBeyondDataAssetEditorModule, BeyondDataAssetEditor)
{% endhighlight %}

## Game Module

The game module needs a small addition for the editor module to be able to find
headers in the game module. This is only necessary if you are on 4.24 or newer
and not using legacy include paths.

In the game module's `.Build.cs` file, add the following line so that the root
module folder is part of the include path.

<div class="code-caption">BeyondDataAsset.Bulid.cs</div>
{% highlight csharp linenos %}
PublicIncludePaths.Add("BeyondDataAsset/");
{% endhighlight %}

## Update Project

Add a second entry to the Modules array in your project's `.uproject` file. For
a brand new project, the file should look like this:

<div class="code-caption">BeyondDataAsset.uproject</div>
{% highlight json linenos %}
{
  "FileVersion": 3,
  "EngineAssociation": "4.26",
  "Category": "",
  "Description": "",
  "Modules": [
  {
    "Name": "BeyondDataAsset",
    "Type": "Runtime",
    "LoadingPhase": "Default"
  },
  {
    "Name": "BeyondDataAssetEditor",
    "Type": "Editor",
    "LoadingPhase":  "Default"
  }
  ]
}
{% endhighlight %}

Finally, modify your project's `Editor.Target.cs` file to point
`ExtraModuleNames` to the editor module instead of the primary game module.

<div class="code-caption">BeyondDataAssetEditor.Target.cs</div>
{% highlight csharp linenos %}
ExtraModuleNames.Add("BeyondDataAssetEditor");
{% endhighlight %}

Because of the dependency we added to our new `.Build.cs` file, we can make
this substitution instead of adding a second name into `ExtraModuleNames`.

At this point you can compile your project and two modules will show up. You
can verify this in `Window > Developer Tools > Modules` or the Add C++ Class
dialog.

[![][5]][5]{: data-lightbox="img-5"}

# Making a Custom Asset Type

The first step in this process is to copy the existing boilerplate that
DataAsset would have provide provided for us. Once we have a copy specific to
one asset class, there will be many opportunities to customize how the asset
looks and functions in the editor. This section is also based on a tutorial by
Orfeas, [Creating Custom Editor Assets][6].

## Class Setup

Custom asset types should not inherit from `UDataAsset`. Set the base class to
`UObject`, or any other class.

You will also need to "export" the class to make it accessible to the editor
module we made earlier. This is done by adding a macro before the class name.
The macro is the module name in all caps folowed by `_API`. Because this class
is in our primary game module, the macro is `BEYONDDATAASSET_API`. If the class
was created via the Add C++ Class dialog, this macro is included by default.

<div class="code-caption">TargetPracticeRound.h</div>
{% highlight cpp linenos %}
class BEYONDDATAASSET_API UTargetPracticeRound : public UObject
{% endhighlight %}

## Factory

Unreal maintains a list of classes that can be created in various contexts. In
this part we will only handle the "Create New" context for our asset class. To
register a new factory, simply create a subclass of `UFactory` and set a few
variables in the constructor to specify which contexts and classes are valid.

This class belongs in the editor module.

<div class="code-caption">TargetPracticeRoundFactory.h</div>
{% highlight cpp linenos %}
#pragma once

#include "Factories/Factory.h"

#include "TargetPracticeRoundFactory.generated.h"

UCLASS()
class UTargetPracticeRoundFactory : public UFactory
{
	GENERATED_BODY()
	
public:

	UTargetPracticeRoundFactory();

	virtual UObject* FactoryCreateNew(UClass* Class, UObject* InParent, FName Name, EObjectFlags Flags, UObject* Context, FFeedbackContext* Warn) override;
};
{% endhighlight %}

<div class="code-caption">TargetPracticeRoundFactory.cpp</div>
{% highlight cpp linenos %}
#include "TargetPracticeRoundFactory.h"

#include "TargetPracticeRound.h"

UTargetPracticeRoundFactory::UTargetPracticeRoundFactory()
{
	bCreateNew = true;
	bEditAfterNew = true;
	SupportedClass = UTargetPracticeRound::StaticClass();
}

UObject* UTargetPracticeRoundFactory::FactoryCreateNew(UClass* Class, UObject* InParent, FName Name, EObjectFlags Flags, UObject* Context, FFeedbackContext* Warn)
{
	return NewObject<UTargetPracticeRound>(InParent, UTargetPracticeRound::StaticClass(), Name, Flags | RF_Transactional);
}
{% endhighlight %}

This class is a simplified version of `UDataAssetFactory` that doesn't have a
class selector. Note that `RF_Transactional` is specifically added into the
object flags here. This is for proper undo/redo support.

## AssetTypeActions

Create a new `FAssetTypeActions_Base` subclass, this specifies to the editor
how the asset should look and function. At the moment we are only overriding
the functions that specify the asset's most basic properties, but this class is
where you would extend the right-click menu and change which AssetEditor opens
for the asset, among many other customizations.

<div class="code-caption">AssetTypeActions_TargetPracticeRound.h</div>
{% highlight cpp linenos %}
#pragma once

#include "AssetTypeActions_Base.h"
#include "BeyondDataAssetEditor.h"
#include "TargetPracticeRound.h"

class FAssetTypeActions_TargetPracticeRound : public FAssetTypeActions_Base
{
public:
	virtual FText GetName() const override { return NSLOCTEXT("AssetTypeActions", "AssetTypeActions_TargetPracticeRound", "Target Practice Round"); }
	virtual FColor GetTypeColor() const override { return FColor(20, 60, 210); }
	virtual UClass* GetSupportedClass() const override { return UTargetPracticeRound::StaticClass(); }
	virtual uint32 GetCategories() override { return FBeyondDataAssetEditorModule::GetAssetCategory(); }
};
{% endhighlight %}

The implementation of `GetAssetCategory()` is handled below.

## Editor Registration

In order to use the new AssetTypeActions, we must register it with the
`AssetTools` module, which we will handle in our module's `StartupModule`
function. We will also make a custom category. If this is skipped, the asset
will still be visible just under the "Miscellaneous" category.

<div class="code-caption">BeyondDataAssetEditor.h</div>
{% highlight cpp linenos %}
// ...
#include "AssetTypeCategories.h"
#include "IAssetTypeActions.h"
// ...
class FBeyondDataAssetEditorModule : public IModuleInterface
{
public:
	// ...

	static EAssetTypeCategories::Type GetAssetCategory() { return CustomAssetCategory; }

private:

	static EAssetTypeCategories::Type CustomAssetCategory;
	TArray<TSharedPtr<IAssetTypeActions>> RegisteredAssetTypeActions;
};
{% endhighlight %}

<div class="code-caption">BeyondDataAssetEditor.cpp</div>
{% highlight cpp linenos %}
// ...
#include "AssetTypeActions_TargetPracticeRound.h"
#include "IAssetTools.h"

EAssetTypeCategories::Type FBeyondDataAssetEditorModule::CustomAssetCategory;
// ...
void FBeyondDataAssetEditorModule::StartupModule()
{
	IAssetTools& AssetTools = FModuleManager::LoadModuleChecked<FAssetToolsModule>("AssetTools").Get();
	CustomAssetCategory = AssetTools.RegisterAdvancedAssetCategory(FName(TEXT("MyGame")), NSLOCTEXT("BeyondDataAssetEditor", "MyGameCategory", "My Game"));

	auto RegisterAssetTypeAction = [&](TSharedRef<IAssetTypeActions> Action)
	{
		AssetTools.RegisterAssetTypeActions(Action);
		RegisteredAssetTypeActions.Add(Action);
	};

	RegisterAssetTypeAction(MakeShareable(new FAssetTypeActions_TargetPracticeRound));
}

void FBeyondDataAssetEditorModule::ShutdownModule()
{
	if (FModuleManager::Get().IsModuleLoaded("AssetTools"))
	{
		IAssetTools& AssetTools = FModuleManager::GetModuleChecked<FAssetToolsModule>("AssetTools").Get();
		for (auto CreatedAssetTypeAction : RegisteredAssetTypeActions)
		{
			AssetTools.UnregisterAssetTypeActions(CreatedAssetTypeAction.ToSharedRef());
		}
	}
	RegisteredAssetTypeActions.Empty();
}
// ...
{% endhighlight %}

Finally, we will need to add a new module dependency to our `.Build.cs` file
for the AssetTools module which we are now using.

<div class="code-caption">BeyondDataAssetEditor.Build.cs</div>
{% highlight csharp linenos %}
// ...
PublicDependencyModuleNames.AddRange(new string[]
{
// ...
	"AssetTools"
});
// ...
{% endhighlight %}

------------------------------------------------------------------------------

At this point the project will compile, and you can see that any existing
assets will be using the name and color specified in your AssetTypeActions.
Double clicking the asset will open the same default editor as it did under
`UDataAsset`. In the "Add/Import" menu you'll now see your new category and
asset type. Creating a new asset this way will run `FactoryCreateNew` on your
factory class.

[![][7]][7]{: data-lightbox="img-7"}

In part 2, we will explore importing and exporting instances of our asset from
files on disk, before diving into a custom AssetEditor in parts 3 and 4.

[1]: /img/unreal/BeyondDataAsset/DataAssetEditor.png "DataAsset Editor"
[2]: https://www.orfeasel.com/creating-custom-modules/
[3]: https://docs.unrealengine.com/en-US/ProgrammingAndScripting/GameplayArchitecture/Gameplay/index.html
[4]: /img/unreal/BeyondDataAsset/EditorModuleFiles.png "New Editor Module Files"
[5]: /img/unreal/BeyondDataAsset/EditorModuleNewClass.png "New C++ Class Dialog with Editor Module"
[6]: https://www.orfeasel.com/creating-custom-editor-assets/
[7]: /img/unreal/BeyondDataAsset/CustomAssetType.png "Customized Asset Color and Menu Entry"