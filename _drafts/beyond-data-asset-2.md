---
layout: post
status: publish
published: true
comments: true
has-code: true
has-lightbox: true
title: Beyond DataAsset - Import & Export (Part 2)
date: '2020-12-15 00:00:00 -0700'
tags: [unreal, data-asset, c++]
preview-img:
    url: /img/blog/2015/10/20151023_113508.jpg
    alt: VR for G3
---

One of the big benefits to setting up your own custom asset type is the ability
to import and export instances of your asset. If you are working with external
software, this is the most natural way to interface it with Unreal. This can
also be the gateway into deeper Excel integrations.

In part 1, we looked at how to set up a "target practice" asset from scratch,
without the boilerplate provided by DataAsset. Now we will be looking at
reading and writing them from an external file.

# Class Setup

Assets that can be imported need an instance of `UAssetImportData`. This class
maintains source file paths, hashes, and timestamps. This allows the engine to
reimport from the same file, and watch source files for changes.

We need to add one to our asset class, and make sure it's initialized as early
in the loading process as possible. This setup is the same as every other
importable asset class.

<div class="code-caption">TargetPracticeRound.h</div>
{% highlight cpp linenos %}
// ...
class BEYONDDATAASSET_API UTargetPracticeRound : public UObject
{
    // ...
#if WITH_EDITORONLY_DATA
    UPROPERTY(VisibleAnywhere, Instanced, Category=ImportSettings)
    class UAssetImportData* AssetImportData;
#endif

    virtual void PostInitProperties() override;
};
{% endhighlight %}

<div class="code-caption">TargetPracticeRound.cpp</div>
{% highlight cpp linenos %}
#include "TargetPracticeRound.h"
#include "EditorFramework/AssetImportData.h"

void UTargetPracticeRound::PostInitProperties()
{
#if WITH_EDITORONLY_DATA
    if (!HasAnyFlags(RF_ClassDefaultObject))
    {
        AssetImportData = NewObject<UAssetImportData>(this, TEXT("AssetImportData"));
    }
#endif
    Super::PostInitProperties();
}
{% endhighlight %}

Some asset types have their own subclass of `UAssetImportData` with settings
specific to the asset. There are many examples of this in the engine, but a
great example is `UStaticMesh`, which has many importers for various 3d mesh
file formats. The FBX importer, specifically, provides an instance of
`UFbxStaticMeshImportData`. FBX files can import more than just static meshes,
so there are a chain of base classes that contain the properties common between
the targets.

This example in particular is important as it shows the many-to-many
relationship between factories and asset types.

# AssetTypeActions

Some small changes are needed in our AssetTypeActions clsss in order to inform
the engine that our class can be imported and to grab the source file paths.

<div class="code-caption">AssetTypeActions_TargetPracticeRound.h</div>
{% highlight cpp linenos %}
// ...
class FAssetTypeActions_TargetPracticeRound : public FAssetTypeActions_Base
{
    // ...
    virtual bool IsImportedAsset() const override { return true; }
    virtual void GetResolvedSourceFilePaths(const TArray<UObject*>& TypeAssets, TArray<FString>& OutSourceFilePaths) const override;
};
{% endhighlight %}

<div class="code-caption">AssetTypeActions_TargetPracticeRound.cpp</div>
{% highlight cpp linenos %}
#include "AssetTypeActions_TargetPracticeRound.h"

#include "EditorFramework/AssetImportData.h"

void FAssetTypeActions_TargetPracticeRound::GetResolvedSourceFilePaths(const TArray<UObject*>& TypeAssets, TArray<FString>& OutSourceFilePaths) const
{
    for (auto& Asset : TypeAssets)
    {
        const UTargetPracticeRound* TargetPracticeRound = CastChecked<UTargetPracticeRound>(Asset);
        if (TargetPracticeRound->AssetImportData)
        {
            TargetPracticeRound->AssetImportData->ExtractFilenames(OutSourceFilePaths);
        }
    }
}

{% endhighlight %}

This will enable the "Imported Asset" actions in the asset context menu.

[![][1]][1]{: data-lightbox="img-1"}

# File Format

`UFactory` provides entry points for binary and text files, or lets you load
the file yourself from a string path. For the purposes of this tutorial, we
will be dealing with a basic JSON format matching the class structure of our
asset.

A sample file to import:

<div class="code-caption">ImportTest.targetpractice</div>
{% highlight json linenos %}
{
    "display_name": "Imported Round",
    "waves": [
        {
            "timeout": 10,
            "targets": [
                {
                    "color": { "r": 255, "g": 0, "b": 0 },
                    "location": { "x": -50, "y": 100, "z": 200 }
                },
                {
                    "color": { "r": 0, "g": 255, "b": 0 },
                    "location": { "x": 600, "y": 0, "z": 25 }
                }
            ]
        },
        {
            "timeout": 5,
            "targets": [
                {
                    "color": { "r": 0, "g": 0, "b": 255 },
                    "location": { "x": 0, "y": -100, "z": 50 }
                }
            ]
        }
    ]
}
{% endhighlight %}

# Import Factory

To set up importing, we need to make a separate `UFactory` subclass with
different settings in the constructor.

<div class="code-caption">TargetPracticeRoundImportFactory.h</div>
{% highlight cpp linenos %}
#pragma once

#include "Factories/Factory.h"

#include "TargetPracticeRoundImportFactory.generated.h"

UCLASS()
class UTargetPracticeRoundImportFactory : public UFactory
{
    GENERATED_BODY()

public:

    UTargetPracticeRoundImportFactory();

    virtual bool FactoryCanImport(const FString& Filename) override;
    virtual UObject* FactoryCreateText(UClass* InClass, UObject* InParent, FName InName, EObjectFlags Flags, UObject* Context, const TCHAR* Type, const TCHAR*& Buffer, const TCHAR* BufferEnd, FFeedbackContext* Warn) override;
};
{% endhighlight %}

In this case, we configure the new factory for import of a text file with the
extension `.targetpractice`.

<div class="code-caption">TargetPracticeRoundImportFactory.cpp</div>
{% highlight cpp linenos %}
#include "TargetPracticeRoundImportFactory.h"

#include "TargetPracticeRound.h"

UTargetPracticeRoundImportFactory::UTargetPracticeRoundImportFactory()
{
    bCreateNew = false;
    SupportedClass = UTargetPracticeRound::StaticClass();

    bEditorImport = true;
    bText = true;

    Formats.Add(TEXT("targetpractice;Target Practice JSON file"));
}
{% endhighlight %}

`FactoryCanImport` provides an opportunity for a factory to reject some files
from being imported. This function is called after the engine has filtered out
as many factory settings as possible, including the specified file extensions.
It serves no purpose for this simple example, but is useful for when there are
multiple factories for the same file type.

<div class="code-caption">TargetPracticeRoundImportFactory.cpp</div>
{% highlight cpp linenos %}
bool UTargetPracticeRoundImportFactory::FactoryCanImport(const FString& Filename)
{
    return true;
}
{% endhighlight %}

Finally, `FactoryCreateText` is our entry point for running import code. This
function must create a new object, write the imported data, and return it. The
function is also responsible for broadcasting the engine's pre/post asset
import callbacks.

<div class="code-caption">TargetPracticeRoundImportFactory.cpp</div>
{% highlight cpp linenos %}
// ...
#include "EditorFramework/AssetImportData.h"
#include "Serialization/JsonTypes.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
// ...
FLinearColor ParseTargetColor(const TSharedPtr<FJsonObject>& InObject)
{
    FLinearColor Result;
    Result.R = (float)InObject->GetNumberField(TEXT("r"));
    Result.G = (float)InObject->GetNumberField(TEXT("g"));
    Result.B = (float)InObject->GetNumberField(TEXT("b"));
    Result.A = 1;

    return Result;
}

FVector ParseTargetLocation(const TSharedPtr<FJsonObject>& InObject)
{
    FVector Result;
    Result.X = (float)InObject->GetNumberField(TEXT("x"));
    Result.Y = (float)InObject->GetNumberField(TEXT("y"));
    Result.Z = (float)InObject->GetNumberField(TEXT("z"));

    return Result;
}

FTarget ParseTarget(const TSharedPtr<FJsonObject>& InObject)
{
    FTarget Result;
    Result.Color = ParseTargetColor(InObject->GetObjectField(TEXT("color")));
    Result.Transform.SetLocation(ParseTargetLocation(InObject->GetObjectField(TEXT("location"))));

    return Result;
}

UObject* UTargetPracticeRoundImportFactory::FactoryCreateText(UClass* InClass, UObject* InParent, FName InName, EObjectFlags Flags, UObject* Context, const TCHAR* Type, const TCHAR*& Buffer, const TCHAR* BufferEnd, FFeedbackContext* Warn)
{
    GEditor->GetEditorSubsystem<UImportSubsystem>()->BroadcastAssetPreImport(this, InClass, InParent, InName, Type);

    UTargetPracticeRound* Result = nullptr;

    const FString FileContents(BufferEnd - Buffer, Buffer);
    const TSharedRef< TJsonReader<> >& Reader = TJsonReaderFactory<>::Create(FileContents);
    TSharedPtr<FJsonObject> FileObject;
    if (FJsonSerializer::Deserialize(Reader, FileObject))
    {
        Result = NewObject<UTargetPracticeRound>(InParent, InName, Flags | RF_Transactional);
        Result->AssetImportData->Update(UFactory::GetCurrentFilename());
        Result->DisplayName = FText::FromString(FileObject->GetStringField(TEXT("display_name")));

        const TArray<TSharedPtr<FJsonValue>>& WaveValues = FileObject->GetArrayField(TEXT("waves"));
        for (const auto& WaveValue : WaveValues)
        {
            const TSharedPtr<FJsonObject>& WaveObject = WaveValue->AsObject();

            FTargetWave NewWave;
            NewWave.Timeout = (float)WaveObject->GetNumberField(TEXT("timeout"));

            const TArray<TSharedPtr<FJsonValue>>& TargetValues = WaveObject->GetArrayField(TEXT("targets"));
            NewWave.Targets.Reserve(TargetValues.Num());
            for (const auto& TargetValue : TargetValues)
            {
                NewWave.Targets.Add(ParseTarget(TargetValue->AsObject()));
            }

            Result->Waves.Add(NewWave);
        }
    }

    GEditor->GetEditorSubsystem<UImportSubsystem>()->BroadcastAssetPostImport(this, Result);

    return Result;
}
{% endhighlight %}

With this factory, the above `ImportTest.targetpractice` file will import
correctly. Note the source file path and timestamp at the very bottom, that is
how the `UAssetImportData` property appears in the editor.

[![][2]][2]{: data-lightbox="img-2"}

To keep things short and understandable, this sample factory does not do
detailed error reporting or logging. Error reporting methods vary within the
engine. The only built-in error handling is if `FactoryCreateText` returns
`nullptr`.

[![][3]][3]{: data-lightbox="img-3"}

## Reimport Handling

When you modify a file on disk within a watched folder, Unreal will notify you
of the file change and allow you to reimport the file. With an import factory
alone this will do nothing. We must make our import factory also inherit from
the `FReimportHandler` class.

[![][4]][4]{: data-lightbox="img-4"}

Unreal has a number of settings that can be adjusted, including fully automated
asset reimporting whenever a change is detected, as well as watching paths
external to the project directory.

[Auto Reimport \| Unreal Engine Documentation][5]

The code itself is relatively straightforward, the body of `FactoryCreateText`
just needs to be extracted to a separate function so that it can also be called
from `Reimport`.

<div class="code-caption">TargetPracticeRoundImportFactory.h</div>
{% highlight cpp linenos %}
// ...
#include "EditorReimportHandler.h"
// ...
class UTargetPracticeRoundImportFactory : public UFactory, public FReimportHandler
{
    // ...
    virtual bool CanReimport(UObject* Obj, TArray<FString>& OutFilenames) override;
    virtual EReimportResult::Type Reimport(UObject* Obj) override;
    virtual void SetReimportPaths(UObject* Obj, const TArray<FString>& NewReimportPaths) override;
};
{% endhighlight %}

First, extract the JSON parsing code to it's own function and make sure it can
be run multiple times on the same object without causing an issues. In this
case, the `Waves` array must be cleared.

<div class="code-caption">TargetPracticeRoundImportFactory.cpp</div>
{% highlight cpp linenos %}
// ...
void ParseTargetPracticeRound(const TSharedPtr<FJsonObject>& InObject, UTargetPracticeRound* Result)
{
    Result->DisplayName = FText::FromString(InObject->GetStringField(TEXT("display_name")));
    Result->Waves.Reset();

    const TArray<TSharedPtr<FJsonValue>>& WaveValues = InObject->GetArrayField(TEXT("waves"));
    for (const auto& WaveValue : WaveValues)
    {
        const TSharedPtr<FJsonObject>& WaveObject = WaveValue->AsObject();

        FTargetWave NewWave;
        NewWave.Timeout = (float)WaveObject->GetNumberField(TEXT("timeout"));

        const TArray<TSharedPtr<FJsonValue>>& TargetValues = WaveObject->GetArrayField(TEXT("targets"));
        NewWave.Targets.Reserve(TargetValues.Num());
        for (const auto& TargetValue : TargetValues)
        {
            NewWave.Targets.Add(ParseTarget(TargetValue->AsObject()));
        }

        Result->Waves.Add(NewWave);
    }
}

UObject* UTargetPracticeRoundImportFactory::FactoryCreateText(UClass* InClass, UObject* InParent, FName InName, EObjectFlags Flags, UObject* Context, const TCHAR* Type, const TCHAR*& Buffer, const TCHAR* BufferEnd, FFeedbackContext* Warn)
{
    GEditor->GetEditorSubsystem<UImportSubsystem>()->BroadcastAssetPreImport(this, InClass, InParent, InName, Type);

    UTargetPracticeRound* Result = nullptr;

    const FString FileContents(BufferEnd - Buffer, Buffer);
    const TSharedRef< TJsonReader<> >& Reader = TJsonReaderFactory<>::Create(FileContents);
    TSharedPtr<FJsonObject> FileObject;
    if (FJsonSerializer::Deserialize(Reader, FileObject))
    {
        Result = NewObject<UTargetPracticeRound>(InParent, InName, Flags | RF_Transactional);
        Result->AssetImportData->Update(UFactory::GetCurrentFilename());

        ParseTargetPracticeRound(FileObject, Result);
    }

    GEditor->GetEditorSubsystem<UImportSubsystem>()->BroadcastAssetPostImport(this, Result);

    return Result;
}
{% endhighlight %}

Finally, we can implement the reimport handler with the same code used
throughout the engine for an asset with a single import file path.

<div class="code-caption">TargetPracticeRoundImportFactory.cpp</div>
{% highlight cpp linenos %}
// ...
#include "Misc/FileHelper.h"
// ...
bool UTargetPracticeRoundImportFactory::CanReimport(UObject* Obj, TArray<FString>& OutFilenames)
{
    UTargetPracticeRound* TargetPracticeRound = Cast<UTargetPracticeRound>(Obj);
    if (TargetPracticeRound)
    {
        TargetPracticeRound->AssetImportData->ExtractFilenames(OutFilenames);
        return true;
    }
    return false;
}

EReimportResult::Type UTargetPracticeRoundImportFactory::Reimport(UObject* Obj)
{
    UTargetPracticeRound* TargetPracticeRound = Cast<UTargetPracticeRound>(Obj);
    if (!TargetPracticeRound)
    {
        return EReimportResult::Failed;
    }

    FString Data;
    if (!FFileHelper::LoadFileToString(Data, *TargetPracticeRound->AssetImportData->GetFirstFilename()))
    {
        return EReimportResult::Failed;
    }

    const TSharedRef< TJsonReader<> >& Reader = TJsonReaderFactory<>::Create(Data);
    TSharedPtr<FJsonObject> FileObject;
    if (!FJsonSerializer::Deserialize(Reader, FileObject))
    {
        return EReimportResult::Failed;
    }

    TargetPracticeRound->Modify();
    ParseTargetPracticeRound(FileObject, TargetPracticeRound);

    return EReimportResult::Succeeded;
}

void UTargetPracticeRoundImportFactory::SetReimportPaths(UObject* Obj, const TArray<FString>& NewReimportPaths)
{
    UTargetPracticeRound* TargetPracticeRound = Cast<UTargetPracticeRound>(Obj);
    if (TargetPracticeRound && ensure(NewReimportPaths.Num() == 1))
    {
        TargetPracticeRound->AssetImportData->UpdateFilenameOnly(NewReimportPaths[0]);
    }
}
{% endhighlight %}

Now with the reimport handler implemented, choosing to reimport the asset will
work correctly throughout the engine.

# Exporter

The process of importing a custom asset type is covered relatively well by
tutorials online, however very little is written about the process of exporting
Unreal assets out to files on disk.

In our case, we will be writing out the same JSON file format with the same
file extension.

Much like `UFactory`, exporting data from the engine is handled by making a
subclass of `UExporter` and configuring settings in the constructor.

<div class="code-caption">TargetPracticeRoundExporter.h</div>
{% highlight cpp linenos %}
#pragma once

#include "Exporters/Exporter.h"

#include "TargetPracticeRoundExporter.generated.h"

UCLASS()
class UTargetPracticeRoundExporter : public UExporter
{
    GENERATED_BODY()
    
public:

    UTargetPracticeRoundExporter();

    virtual bool ExportText(const FExportObjectInnerContext* Context, UObject* Object, const TCHAR* Type, FOutputDevice& Ar, FFeedbackContext* Warn, uint32 PortFlags) override;
};
{% endhighlight %}

<div class="code-caption">TargetPracticeRoundExporter.cpp</div>
{% highlight cpp linenos %}
#include "TargetPracticeRoundExporter.h"

#include "TargetPracticeRound.h"

UTargetPracticeRoundExporter::UTargetPracticeRoundExporter()
{
    SupportedClass = UTargetPracticeRound::StaticClass();
    bText = true;
    PreferredFormatIndex = 0;
    FormatExtension.Add(TEXT("targetpractice"));
    FormatDescription.Add(TEXT("Target Practice JSON"));
}
{% endhighlight %}

The exporter provides an `FOutputDevice` to export text files. This is the same
base class as Unreal's logger so it only provides `Log` functions that take
strings, so this exporter serializes the JSON values to a string, then sends
that string to `FOutputDevice`.

<div class="code-caption">TargetPracticeRoundExporter.cpp</div>
{% highlight cpp linenos %}
// ...
#include "Serialization/JsonTypes.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonSerializer.h"
// ...
TSharedPtr<FJsonObject> TargetColorToJson(const FLinearColor& InColor)
{
    TSharedPtr<FJsonObject> ColorObject = MakeShared<FJsonObject>();
    ColorObject->SetNumberField(TEXT("r"), InColor.R);
    ColorObject->SetNumberField(TEXT("g"), InColor.G);
    ColorObject->SetNumberField(TEXT("b"), InColor.B);

    return ColorObject;
}

TSharedPtr<FJsonObject> TargetLocationToJson(const FVector& InLocation)
{
    TSharedPtr<FJsonObject> LocationObject = MakeShared<FJsonObject>();
    LocationObject->SetNumberField(TEXT("x"), InLocation.X);
    LocationObject->SetNumberField(TEXT("y"), InLocation.Y);
    LocationObject->SetNumberField(TEXT("z"), InLocation.Z);

    return LocationObject;
}

bool UTargetPracticeRoundExporter::ExportText(const FExportObjectInnerContext* Context, UObject* Object, const TCHAR* Type, FOutputDevice& Ar, FFeedbackContext* Warn, uint32 PortFlags)
{
    UTargetPracticeRound* TargetPracticeRound = CastChecked<UTargetPracticeRound>(Object);

    TSharedRef<FJsonObject> ExportObject = MakeShared<FJsonObject>();
    ExportObject->SetStringField(TEXT("display_name"), TargetPracticeRound->DisplayName.ToString());

    TArray<TSharedPtr<FJsonValue>> WaveObjects;
    WaveObjects.Reserve(TargetPracticeRound->Waves.Num());
    for (const auto& Wave : TargetPracticeRound->Waves)
    {
        TSharedPtr<FJsonObject> WaveObject = MakeShared<FJsonObject>();
        WaveObject->SetNumberField(TEXT("timeout"), Wave.Timeout);

        TArray<TSharedPtr<FJsonValue>> TargetObjects;
        TargetObjects.Reserve(Wave.Targets.Num());
        for (const auto& Target : Wave.Targets)
        {
            TSharedPtr<FJsonObject> TargetObject = MakeShared<FJsonObject>();
            TargetObject->SetObjectField(TEXT("color"), TargetColorToJson(Target.Color));
            TargetObject->SetObjectField(TEXT("location"), TargetLocationToJson(Target.Transform.GetLocation()));

            TargetObjects.Add(MakeShared<FJsonValueObject>(TargetObject));
        }

        WaveObject->SetArrayField(TEXT("targets"), TargetObjects);
        WaveObjects.Add(MakeShared<FJsonValueObject>(WaveObject));
    }

    ExportObject->SetArrayField(TEXT("waves"), WaveObjects);

    FString OutputText;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputText);

    if (FJsonSerializer::Serialize(ExportObject, Writer))
    {
        Ar.Log(OutputText);
        return true;
    }

    return false;
}
{% endhighlight %}

With this exporter complete, any instance of our asset class can be exported to
our JSON format whether or not it was imported.

[![][6]][6]{: data-lightbox="img-6"}

-------------------------------------------------------------------------------

In part 3, we will frame out a custom AssetEditor with a 3d viewport for a much
better editing experience.

[1]: /img/unreal/BeyondDataAsset/ImportContextMenu.png "Imported Asset Actions"
[2]: /img/unreal/BeyondDataAsset/ImportedAsset.png "ImportTest.targetpractice"
[3]: /img/unreal/BeyondDataAsset/ImportFail.png "Failed Import Dialog"
[4]: /img/unreal/BeyondDataAsset/ReimportDialog.png
[5]: https://docs.unrealengine.com/en-US/Basics/AssetsAndPackages/AutoReImport/index.html
[6]: /img/unreal/BeyondDataAsset/ExportContextMenu.png "Export Asset Action"